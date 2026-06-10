import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { app } from "./app.js";
import prisma from "./db/index.js";


import http from "http";
import { Server } from "socket.io";
import initSocket from "./socket/index.js";
import { createWorker } from "./mediasoup/worker.js";

const server = http.createServer(app);

// create socket server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// initialize socket logic
initSocket(io);

const listenOnPort = (port) =>
  new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("error", onError);
      reject(error);
    };

    server.once("error", onError);
    server.listen(port, () => {
      server.off("error", onError);
      resolve();
    });
  });

async function start() {
  try {
    // test DB connection
    await prisma.$queryRaw`SELECT 1`;

    const port = Number(process.env.PORT) || 8000;
    console.log("PORT:", port);

    await listenOnPort(port);
    await createWorker();

    console.log("App is listening at Port:", port);

  } catch (error) {
    if (error?.code === "EADDRINUSE") {
      console.error(
        `Port ${process.env.PORT || 8000} is already in use. Stop the existing server or set a different PORT.`
      );
    } else {
      console.error("Startup Failed:", error);
    }
    process.exit(1);
  }
}

start();
