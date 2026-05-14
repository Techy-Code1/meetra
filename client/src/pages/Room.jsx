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
  setRemoteSocketId,
} from "../webrtc/peer";

const roomId = "room-1";

const Room = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerId, setPeerId] = useState(null);
  const [error, setError] = useState(null);
  const [clientId] = useState(() => Math.floor(100000 + Math.random() * 900000));

  const isInitiatorRef = useRef(false);
  const localStreamRef = useRef(null);
  const peerSocketIdRef = useRef(null);

  useEffect(() => {
    const joinRoom = () => {
      console.log("Connected:", socket.id);
      socket.emit("join-room", { roomId, userId: clientId });
    };

    const start = async () => {
      try {
        const stream = await getLocalStream();
        localStreamRef.current = stream;
        setLocalStream(stream);

        createPeerConnection(socket, roomId, setRemoteStream);
        addLocalTracks(stream);

        socket.on("connect", joinRoom);

        socket.on("joined-room", ({ isInitiator, peers = [] }) => {
          const peer = peers[0];
          isInitiatorRef.current = isInitiator;
          peerSocketIdRef.current = peer?.socketId || null;
          setRemoteSocketId(peerSocketIdRef.current);
          setPeerId(peer?.userId || null);
        });

        socket.on("initiator", () => {
          console.log("You are the initiator");
          isInitiatorRef.current = true;
        });

        socket.on("user-joined", async ({ userId, socketId }) => {
          peerSocketIdRef.current = socketId;
          setRemoteSocketId(socketId);
          setPeerId(userId);

          if (!isInitiatorRef.current) return;

          console.log("User joined -> initiator sending offer");
          await createOffer(socket, roomId, socketId);
        });

        socket.on("offer", async ({ offer, senderSocketId, senderUserId }) => {
          console.log("Received offer -> sending answer");
          peerSocketIdRef.current = senderSocketId;
          setPeerId(senderUserId || senderSocketId);
          await handleOffer(socket, roomId, offer, senderSocketId);
        });

        socket.on("answer", async ({ answer, senderSocketId, senderUserId }) => {
          console.log("Received answer");
          peerSocketIdRef.current = senderSocketId;
          setRemoteSocketId(senderSocketId);
          setPeerId(senderUserId || senderSocketId);
          await handleAnswer(answer);
        });

        socket.on("ice-candidate", async ({ candidate, senderSocketId }) => {
          console.log("Received ICE candidate");
          if (senderSocketId) {
            peerSocketIdRef.current = senderSocketId;
            setRemoteSocketId(senderSocketId);
          }
          await handleIceCandidate(candidate);
        });

        socket.on("user-left", () => {
          console.log("User left");
          setPeerId(null);
          setRemoteStream(null);
          peerSocketIdRef.current = null;
          closePeerConnection();
          createPeerConnection(socket, roomId, setRemoteStream);
          addLocalTracks(stream);
          isInitiatorRef.current = true;
        });

        socket.on("room-full", () => {
          setError("This demo room already has two people in it.");
        });

        socket.on("signal-error", ({ message }) => {
          console.error("WebRTC signal failed:", message);
          setError(message);
        });

        socket.on("connect_error", (err) => {
          console.error("Socket connection failed:", err.message);
          setError(err.message);
        });

        socket.connect();
        if (socket.connected) {
          joinRoom();
        }
      } catch (err) {
        console.error("Room setup failed:", err);
        setError(err.message);
      }
    };

    start();

    return () => {
      socket.off("connect");
      socket.off("joined-room");
      socket.off("initiator");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
      socket.off("room-full");
      socket.off("signal-error");
      socket.off("connect_error");
      socket.disconnect();
      closePeerConnection();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [clientId]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Room: {roomId}</h2>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <div>
          <h3>Your Video</h3>
          <VideoPlayer stream={localStream} muted />
          <p style={{ marginTop: "8px", color: "#555" }}>
            My ID: {clientId}
          </p>
        </div>

        <div>
          <h3>Peer Video</h3>
          <VideoPlayer stream={remoteStream} />
          <p style={{ marginTop: "8px", color: "#555" }}>
            Peer ID: {peerId || "Waiting..."}
          </p>
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
