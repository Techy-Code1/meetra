const registerRoomHandlers = (io, socket) => {
  socket.on("join-room", ({ roomId, userId } = {}) => {
    if (!roomId) return;

    const previousRoomId = socket.data.roomId;
    if (previousRoomId && previousRoomId !== roomId) {
      socket.leave(previousRoomId);
      socket.to(previousRoomId).emit("user-left", {
        userId: socket.data.userId,
        socketId: socket.id,
      });
    }

    const room = io.sockets.adapter.rooms.get(roomId);
    const existingUsers = room
      ? [...room]
          .filter((socketId) => socketId !== socket.id)
          .map((socketId) => io.sockets.sockets.get(socketId))
          .filter(Boolean)
          .map((roomSocket) => ({
            userId: roomSocket.data.userId,
            socketId: roomSocket.id,
          }))
      : [];

    if (existingUsers.length >= 2) {
      socket.emit("room-full", { roomId });
      return;
    }

    const currentUserId = userId || socket.id;

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userId = currentUserId;

    console.log(`${currentUserId} joined room ${roomId}`);

    socket.emit("joined-room", {
      roomId,
      userId: currentUserId,
      isInitiator: existingUsers.length === 0,
      peers: existingUsers,
    });

    if (existingUsers.length === 0) {
      socket.emit("initiator");
      return;
    }

    socket.to(roomId).emit("user-joined", {
      userId: currentUserId,
      socketId: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const { roomId, userId } = socket.data;
    if (!roomId) return;

    socket.to(roomId).emit("user-left", {
      userId,
      socketId: socket.id,
    });
  });
};

export default registerRoomHandlers;
