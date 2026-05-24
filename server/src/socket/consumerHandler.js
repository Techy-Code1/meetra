import { getRoom } from "../mediasoup/rooms.js";

import { getTransport } from "../mediasoup/transport.js";

import {
  addConsumer,
  getConsumer,
  removeConsumersForSocket,
} from "../mediasoup/consumers.js";

import {
  getProducer,
} from "../mediasoup/producers.js";

const registerConsumerHandlers = ( io, socket) => {

  socket.on("consume",
    async (
      {
        roomId,
        transportId,
        rtpCapabilities,
        producerId,
      },

      callback
    ) => {

      try {

        const room =
          getRoom(roomId);

        const transport =
          getTransport(transportId);

        const producer =
          getProducer(producerId);

        // Validate every id from the client before creating a consumer.
        if (!room) {
          throw new Error("Room not found");
        }

        if (!transport) {
          throw new Error("Transport not found");
        }

        if (transport.appData?.socketId !== socket.id) {
          throw new Error("Transport does not belong to this socket");
        }

        if (!producer || producer.closed) {
          throw new Error("Producer not found");
        }

        const router = room.router;
        if (
          !router.canConsume({
            producerId,
            rtpCapabilities,
          })
        ) {

          throw new Error(
            "Cannot consume"
          );

        }

        const consumer =
          await transport.consume({
            producerId,
            rtpCapabilities,
            paused: false,
          });

        addConsumer(
          socket.id,
          consumer
        );

        console.log("Consumer created:", consumer.id);

        if (consumer.kind === "video") {
          await consumer.requestKeyFrame();
        }

        callback({
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters:
            consumer.rtpParameters,
        });

      } catch (error) {

        console.error(error);

        callback({
          error: error.message,
        });

      }

    }
  );

  socket.on("consumer-resume", async ({ consumerId }, callback = () => {}) => {
    try {
      const consumer = getConsumer(consumerId);

      // A socket can resume only its own consumer.
      if (!consumer) {
        throw new Error("Consumer not found");
      }

      if (consumer.appData?.socketId !== socket.id) {
        throw new Error("Consumer does not belong to this socket");
      }

      await consumer.resume();

      if (consumer.kind === "video") {
        await consumer.requestKeyFrame();
      }

      callback({ resumed: true });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on("disconnect", () => {
    removeConsumersForSocket(socket.id);
  });

};

export default registerConsumerHandlers;
