import registerRoomHandlers from "./roomHandler.js";
import registerWebRTCHandlers from "./webrtcHandler.js";

//initialize socket logic (tell connection and disconnection events, and register handlers)
const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // register handlers
    registerRoomHandlers(io, socket);
    registerWebRTCHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

export default initSocket;