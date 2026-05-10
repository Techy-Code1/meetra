const registerWebRTCHandlers = (io, socket) => {
  const relaySignal = (eventName, payload = {}) => {
    const { roomId, targetSocketId } = payload;
    const room = roomId ? io.sockets.adapter.rooms.get(roomId) : null;

    if (!roomId || !targetSocketId || !room?.has(socket.id) || !room.has(targetSocketId)) {
      socket.emit("signal-error", {
        eventName,
        message: "Unable to relay WebRTC signal to the requested peer.",
      });
      return;
    }

    io.to(targetSocketId).emit(eventName, {
      ...payload,
      senderSocketId: socket.id,
      senderUserId: socket.data.userId,
    });
  };

  // OFFER (media (audio/video) and connection details)
  socket.on("offer", (payload) => {
    relaySignal("offer", payload);
  });

  // ANSWER
  socket.on("answer", (payload) => {
    relaySignal("answer", payload);
  });

  // ICE CANDIDATE (etstablishing peer-to-peer connection)
  socket.on("ice-candidate", (payload) => {
    relaySignal("ice-candidate", payload);
  });

};

export default registerWebRTCHandlers;
