import { getRoom } from "./rooms.js";
import os from "os";

// Stores WebRTC transports by mediasoup transport id.
const transports = new Map();

// Tracks all transport ids owned by one socket for disconnect cleanup.
const socketTransports = new Map();

const isLocalAddress = (address = "") =>
  address === "127.0.0.1" ||
  address === "::1" ||
  address === "::ffff:127.0.0.1";

const getLocalAnnouncedIp = (clientAddress) => {
  if (isLocalAddress(clientAddress)) {
    return "127.0.0.1";
  }

  if (process.env.MEDIASOUP_ANNOUNCED_IP) {
    return process.env.MEDIASOUP_ANNOUNCED_IP;
  }

  const interfaces = os.networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }

  return "127.0.0.1";
};

export const createWebRtcTransport = async (
  roomId,
  socketId,
  direction = "send",
  clientAddress,
) => {

  console.log(`Searching room: ${roomId}`);
  
  // Find the mediasoup room before creating a transport.
  const room = getRoom(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  const announcedIp = getLocalAnnouncedIp(clientAddress);
  const listenIp = {
    ip: "0.0.0.0",
    announcedIp,
  };

  // Transport handles the browser-to-server media connection.
  const transport = await room.router.createWebRtcTransport({
    listenIps: [listenIp],

    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  transport.appData = {
    roomId,
    socketId,
    direction,
  };

  // Save by transport id because one socket can have send and recv transports.
  transports.set(transport.id, transport);

  const transportIds = socketTransports.get(socketId) || new Set();
  transportIds.add(transport.id);
  socketTransports.set(socketId, transportIds);

  console.log(`Transport created: ${transport.id}`);

  return transport;
};


export const getTransport = (transportId) => {
  return transports.get(transportId);
};

export const closeTransportsForSocket = (socketId) => {
  const transportIds = socketTransports.get(socketId);

  if (!transportIds) return;

  for (const transportId of transportIds) {
    const transport = transports.get(transportId);

    if (transport) {
      transport.close();
      transports.delete(transportId);
    }
  }

  socketTransports.delete(socketId);
};
