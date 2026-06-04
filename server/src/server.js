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

await createWorker(); 

async function start() {
  try {
    // test DB connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database Connected Successfully");

    const port = process.env.PORT || 8000;
    console.log("PORT:", port);

    server.listen(port, () => {
      console.log("App is listening at Port:", port);
    });

  } catch (error) {
    console.log("Database Connection Failed:", error);
    process.exit(1);
  }
}

start();
