import { getTransport } from "../mediasoup/transport.js";
import {
  addProducer,
  removeProducersForSocket,
} from "../mediasoup/producers.js";

const registerProducerHandlers = (io, socket) => {

  // Browser calls this after sendTransport.produce(track).
  socket.on(
    "produce",

    async ({ roomId, transportId, kind, rtpParameters }, callback) => {

      try {

        const transport = getTransport(transportId);

        if (!transport) {
          throw new Error("Transport not found");
        }

        if (transport.appData?.socketId !== socket.id) {
          throw new Error("Transport does not belong to this socket");
        }

        // Create server-side Producer for this audio/video track.
        const producer = await transport.produce({
          kind,
          rtpParameters,
        });

        addProducer(socket.id, roomId, producer);

        console.log(`Producer created: ${producer.id}`);

        // Let other users know there is a new track they can consume.
        socket.to(roomId).emit("new-producer", {
          producerId: producer.id,
          socketId: socket.id,
          kind,
        });

        callback({
          id: producer.id,
        });

      } catch (error) {

        console.error(error);

        callback({
          error: error.message,
        });

      }

    }
  );

  // Close the producer when the user leaves.
  socket.on("disconnect", () => {
    removeProducersForSocket(socket.id);
  });

};

export default registerProducerHandlers;
