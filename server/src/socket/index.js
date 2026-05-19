import registerRoomHandlers from "./roomHandler.js";
import registerTransportHandlers from "./transportHandler.js";
import registerProducerHandlers from "./producerHandler.js";
import registerConsumerHandlers from "./consumerHandler.js";

// Main Socket Initialization
const initSocket = (io) => {

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

  
    // Room Events
    registerRoomHandlers(io, socket);


    // Mediasoup Transport Events
    registerTransportHandlers(io, socket);


    // Producer Events
    registerProducerHandlers(io, socket);


    // Consumer Events
    registerConsumerHandlers(io, socket);

 
    // Disconnect Event
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

  });

};

export default initSocket;
