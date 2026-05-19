import { useEffect, useRef, useState } from "react";
import { socket } from "../sockets/socket";
import getLocalStream from "../webrtc/media";
import VideoPlayer from "../components/VideoPlayer";

import {
  createDevice,
  getDevice,
} from "../webrtc/device";

const roomId = "room-1";

const Room = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState("Searching room...");
  const [error, setError] = useState("");

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());

  useEffect(() => {
    let sendTransport;
    let recvTransport;
    let isMounted = true;
    let isRecvTransportReady = false;

    // Producers can arrive before recvTransport is ready, so queue them.
    const pendingProducers = [];
    const consumedProducerIds = new Set();

    // Converts Socket.IO callbacks into awaitable promises.
    const emitWithAck = (event, payload) => (
      new Promise((resolve, reject) => {
        socket.emit(event, payload, (response = {}) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          resolve(response);
        });
      })
    );

    const addRemoteTrack = (track) => {
      const stream = remoteStreamRef.current;

      // Prevent duplicate tracks when the same producer event arrives twice.
      if (!stream.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
        stream.addTrack(track);
      }

      setRemoteStream(new MediaStream(stream.getTracks()));
    };

    const createTransport = async (device, direction) => {
      // "send" uploads our tracks; "recv" downloads remote tracks.
      const params = await emitWithAck("create-transport", {
        roomId,
        direction,
      });

      const transport = direction === "recv"
        ? device.createRecvTransport(params)
        : device.createSendTransport(params);

      transport.on("connect", ({ dtlsParameters }, callback, errback) => {
        socket.emit(
          "connect-transport",
          {
            transportId: params.id,
            dtlsParameters,
          },
          (response = {}) => {
            if (response.error) {
              errback(new Error(response.error));
              return;
            }

            callback();
          }
        );
      });

      if (direction === "send") {
        transport.on("produce", ({ kind, rtpParameters }, callback, errback) => {
          socket.emit(
            "produce",
            {
              roomId,
              transportId: params.id,
              kind,
              rtpParameters,
            },
            (response = {}) => {
              if (response.error) {
                errback(new Error(response.error));
                return;
              }

              callback({ id: response.id });
            }
          );
        });
      }

      return transport;
    };

    const consumeProducer = async (producer) => {
      const producerId = producer?.producerId;

      // Skip missing producer data and tracks we already consumed.
      if (!producerId || consumedProducerIds.has(producerId)) {
        return;
      }

      // Wait until the receive transport exists before consuming.
      if (!isRecvTransportReady || !recvTransport) {
        pendingProducers.push(producer);
        return;
      }

      consumedProducerIds.add(producerId);

      try {
        const device = getDevice();
        const data = await emitWithAck("consume", {
          roomId,
          transportId: recvTransport.id,
          producerId,
          rtpCapabilities: device.rtpCapabilities,
        });

        console.log("Consumer data:", data);

        const consumer = await recvTransport.consume({
          id: data.id,
          producerId: data.producerId,
          kind: data.kind,
          rtpParameters: data.rtpParameters,
        });

        addRemoteTrack(consumer.track);

        // The server starts consumers paused; resume after the browser creates it.
        await emitWithAck("consumer-resume", {
          consumerId: consumer.id,
        });

        setStatus("Connected");
      } catch (consumeError) {
        consumedProducerIds.delete(producerId);
        console.error(consumeError);
        setError(consumeError.message);
      }
    };


    // it help to remove producers that arrived before the receive transport was ready.
    const flushPendingProducers = async () => {
      while (pendingProducers.length > 0) {
        const producer = pendingProducers.shift();
        await consumeProducer(producer);
      }
    };

    const handleConnect = () => {
      setStatus("Joining room...");
      socket.emit("join-room", { roomId });
    };

    const handleJoinedRoom = ({ producers = [] }) => {
      setStatus(producers.length > 0 ? "Connecting to participant..." : "Waiting for participant...");
      // Existing producers are tracks created before this tab joined.
      producers.forEach((producer) => consumeProducer(producer));
    };

    const handleRouterRtpCapabilities = async ({ rtpCapabilities }) => {
      try {
        setStatus("Preparing media...");

        await createDevice(rtpCapabilities);

        const device = getDevice();

        // Prepare receiving first so Tab B can consume Tab A immediately.
        recvTransport = await createTransport(device, "recv");
        isRecvTransportReady = true;
        await flushPendingProducers();

        const stream = await getLocalStream();

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        sendTransport = await createTransport(device, "send");

        // Each local track becomes a producer on the server.
        for (const track of stream.getTracks()) {
          await sendTransport.produce({ track });
        }

        await flushPendingProducers();
      } catch (setupError) {
        console.error(setupError);
        setError(setupError.message);
        setStatus("Connection failed");
      }
    };

    const handleNewProducer = (producer) => {
      console.log("New producer detected:", producer);
      // Live event for tracks created after this tab has joined.
      consumeProducer(producer);
    };

    const handleRoomFull = () => {
      setError("This room already has two people in it.");
      setStatus("Room full");
    };

    // Set up Socket.IO event listeners.
    socket.on("connect", handleConnect);
    socket.on("joined-room", handleJoinedRoom);
    socket.on("router-rtp-capabilities", handleRouterRtpCapabilities);
    socket.on("new-producer", handleNewProducer);
    socket.on("room-full", handleRoomFull);

    socket.connect();

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      isMounted = false;

      if (sendTransport) {
        sendTransport.close();
      }

      if (recvTransport) {
        recvTransport.close();
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());

      // Clean up Socket.IO event listeners and disconnect.
      socket.off("connect", handleConnect);
      socket.off("joined-room", handleJoinedRoom);
      socket.off("router-rtp-capabilities", handleRouterRtpCapabilities);
      socket.off("new-producer", handleNewProducer);
      socket.off("room-full", handleRoomFull);
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ maxWidth: "760px", margin: "40px auto", textAlign: "center" }}>
      <h2>Mediasoup Room</h2>
      <p>{status}</p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <div>
          <h3>Local Video</h3>
          <VideoPlayer
            stream={localStream}
            muted
          />
        </div>

        <div>
          <h3>Remote Video</h3>
          <VideoPlayer
            stream={remoteStream}
          />
        </div>
      </div>
    </div>
  );
};

export default Room;
