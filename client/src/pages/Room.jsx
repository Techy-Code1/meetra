import { useEffect, useRef, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { socket } from "../sockets/socket";
import getLocalStream from "../webrtc/media";

import {
  addLocalTracks,
  closePeerConnection,
  createOffer,
  createPeerConnection,
  handleAnswer,
  handleIceCandidate,
  handleOffer,
} from "../webrtc/peer";

const Room = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState(null);

  const isInitiatorRef = useRef(false);
  const roomId = "room-1";

  useEffect(() => {
    const start = async () => {
      try {
        const stream = await getLocalStream();
        setLocalStream(stream);

        createPeerConnection(socket, roomId, setRemoteStream);
        addLocalTracks(stream);

        socket.on("connect", () => {
          console.log("Connected:", socket.id);
          socket.emit("join-room", { roomId });
        });

        socket.on("initiator", () => {
          console.log("You are the initiator");
          isInitiatorRef.current = true;
        });

        socket.on("user-joined", async () => {
          if (!isInitiatorRef.current) return;

          console.log("User joined -> initiator sending offer");
          await createOffer(socket, roomId);
        });

        socket.on("offer", async ({ offer }) => {
          console.log("Received offer -> sending answer");
          await handleOffer(socket, roomId, offer);
        });

        socket.on("answer", async ({ answer }) => {
          console.log("Received answer");
          await handleAnswer(answer);
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          console.log("Received ICE candidate");
          await handleIceCandidate(candidate);
        });

        socket.connect();
      } catch (err) {
        console.error("Room setup failed:", err);
        setError(err.message);
      }
    };

    start();

    return () => {
      socket.off("connect");
      socket.off("initiator");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.disconnect();
      closePeerConnection();
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Room: {roomId}</h2>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <div>
          <h3>Your Video</h3>
          <VideoPlayer stream={localStream} muted />
        </div>

        <div>
          <h3>Peer Video</h3>
          <VideoPlayer stream={remoteStream} />
        </div>
      </div>

      {!remoteStream && (
        <p style={{ color: "gray", marginTop: "20px" }}>
          Waiting for another user to join...
        </p>
      )}
    </div>
  );
};

export default Room;
