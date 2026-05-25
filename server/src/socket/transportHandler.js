import {
  createWebRtcTransport,
  getTransport,
  closeTransportsForSocket,
} from "../mediasoup/transport.js";

const registerTransportHandlers = (io, socket) => {


  // Browser asks server to create a mediasoup transport.
  socket.on("create-transport", async ({ roomId, direction }, callback) => {

    try {

      // Create transport for this room and socket.
      const transport = await createWebRtcTransport(
        roomId,
        socket.id,
        direction,
        socket.handshake.address
      );

      callback({
        id: transport.id,

        iceParameters: transport.iceParameters,     // ICE setup info.
        iceCandidates: transport.iceCandidates,     // Possible network paths.
        dtlsParameters: transport.dtlsParameters,   // Security connection info.
      });

    } catch (error) {

      console.error(error);

      callback({
        error: error.message,
      });

    }

  });

  // Browser sends DTLS info to connect the transport.
  socket.on(
    "connect-transport",

    async ({ transportId, dtlsParameters }, callback) => {

      try {

        // Find the transport created for this socket.
        const transport = getTransport(transportId);

        if (!transport) {
          throw new Error("Transport not found");
        }

        if (transport.appData?.socketId !== socket.id) {
          throw new Error("Transport does not belong to this socket");
        }

        // Connect transport after browser sends DTLS parameters.
        await transport.connect({
          dtlsParameters,
        });

        console.log("Transport connected");

        callback({
          connected: true,
        });

      } catch (error) {

        console.error(error);

        callback({
          error: error.message,
        });

      }

    }
  );

  socket.on("disconnect", () => {
    closeTransportsForSocket(socket.id);
  });

};

export default registerTransportHandlers;
