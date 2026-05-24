import {
  createRoom,
  getRoom,
  addPeerToRoom,
  removePeerFromRoom,
} from "../mediasoup/rooms.js";
import { getProducersForRoom } from "../mediasoup/producers.js";


const registerRoomHandlers = (io, socket) => {
  // User joins a room with roomId and optional userId.
  socket.on("join-room", async ({ roomId, userId } = {}) => {
    if (!roomId) return;

    // Leave old room before joining a new one.
    const previousRoomId = socket.data.roomId;
    if (previousRoomId && previousRoomId !== roomId) {
      socket.leave(previousRoomId);

      // Keep mediasoup room peer list in sync when a socket changes rooms.
      removePeerFromRoom(previousRoomId, socket.id);

      socket.to(previousRoomId).emit("user-left", {
        userId: socket.data.userId,
        socketId: socket.id,
      });
    }

    // Get users already connected in this socket room.
    const room = io.sockets.adapter.rooms.get(roomId);
    const existingUsers = room
      ? [...room]
          .filter((socketId) => socketId !== socket.id)
          .map((socketId) => io.sockets.sockets.get(socketId))
          .filter(Boolean)
          .map((roomSocket) => ({
            userId: roomSocket.data.userId,
            socketId: roomSocket.id,
            mic: roomSocket.data.mediaState?.mic ?? true,
            cam: roomSocket.data.mediaState?.cam ?? true,
          }))
      : [];

    const currentUserId = userId || socket.id;

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userId = currentUserId;
    socket.data.mediaState = socket.data.mediaState || {
      mic: true,
      cam: true,
    };

    // Create mediasoup room only once.
    let mediasoupRoom = getRoom(roomId);
    if (!mediasoupRoom) {
      mediasoupRoom = await createRoom(roomId);
    }

    // Track this socket inside our mediasoup room store.
    // Socket.IO tracks who receives events; this list tracks mediasoup peers.
    addPeerToRoom(roomId, socket.id);

    console.log(`${currentUserId} joined room ${roomId}`);

    socket.emit("joined-room", {
      roomId,
      userId: currentUserId,
      isInitiator: existingUsers.length === 0,
      peers: existingUsers,
      producers: getProducersForRoom(roomId, socket.id),
    });

    // Send router capabilities so the browser can load mediasoup Device.
    socket.emit("router-rtp-capabilities", {
      rtpCapabilities: mediasoupRoom.router.rtpCapabilities,
    });

    // First user becomes the call initiator.
    if (existingUsers.length === 0) {
      socket.emit("initiator");
      return;
    }

    // Tell the existing user that a new user joined.
    socket.to(roomId).emit("user-joined", {
      userId: currentUserId,
      socketId: socket.id,
      mic: socket.data.mediaState.mic,
      cam: socket.data.mediaState.cam,
    });
  });

  socket.on("participant-media-state", ({ roomId, mic, cam } = {}) => {
    if (!roomId || socket.data.roomId !== roomId) return;

    socket.data.mediaState = {
      mic: Boolean(mic),
      cam: Boolean(cam),
    };

    socket.to(roomId).emit("participant-media-state", {
      userId: socket.data.userId,
      socketId: socket.id,
      ...socket.data.mediaState,
    });
  });

  // Notify room when this socket disconnects.
  socket.on("disconnect", () => {
    const { roomId, userId } = socket.data;
    if (!roomId) return;

    // Remove disconnected socket from mediasoup room peer tracking.
    removePeerFromRoom(roomId, socket.id);

    socket.to(roomId).emit("user-left", {
      userId,
      socketId: socket.id,
    });
  });
};

export default registerRoomHandlers;
