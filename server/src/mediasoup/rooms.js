import { mediaCodecs } from "./config.js";
import { getWorker } from "./worker.js";

//Map: used for store room (key => value) by their own roomID.
const rooms = new Map();

export const createRoom = async (roomId) => {
  const worker = getWorker();

  //Router handles media communication inside room.
  //It routes: audio video screen share between users.
  const router = await worker.createRouter({
    mediaCodecs,
  });

  rooms.set(roomId, {
    router,
    peers: [],
  });

  console.log(`Room created: ${roomId}`);

  return rooms.get(roomId);
};


//This function finds existing room.
export const getRoom = (roomId) => {
  return rooms.get(roomId);
};


export const addPeerToRoom = (roomId, socketId) => {
  const room = rooms.get(roomId);

  // Avoid duplicate socket IDs if the same client emits join-room again.
  if (room && !room.peers.includes(socketId)) {
    room.peers.push(socketId);
  }
};

export const removePeerFromRoom = (roomId, socketId) => {
  const room = rooms.get(roomId);

  // Keep only active peers after a user leaves or disconnects.
  if (room) {
    room.peers = room.peers.filter((peerId) => peerId !== socketId);
  }
};


export const getPeers = (roomId) => {
  const room = rooms.get(roomId);
  return room?.peers || [];
};
