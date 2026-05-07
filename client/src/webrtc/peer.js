let peerConnection;
let pendingIceCandidates = [];

export const createPeerConnection = (socket, roomId, setRemoteStream) => {
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // Google's public STUN server
  });

  // Handle incoming remote stream
  peerConnection.ontrack = (event) => {
    console.log("Received remote stream");
    setRemoteStream(event.streams[0]);
  };

  // Handle ICE candidates (establish a connection between peers )
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("Sending ICE candidate");
      socket.emit("ice-candidate", {
        roomId,
        candidate: event.candidate,
      });
    }
  };


  // Log connection state changes for debugging
  peerConnection.onconnectionstatechange = () => {
    console.log("Peer connection:", peerConnection.connectionState);
  };

  return peerConnection;
};

// Add any pending ICE candidates once the remote description is set (remote description means the offer or answer from the other peer has been received and set)
const addPendingIceCandidates = async () => {
  for (const candidate of pendingIceCandidates) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  pendingIceCandidates = [];
};

// Add local media tracks to the peer connection
export const addLocalTracks = (stream) => {
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });
};


//Send an offer to the other peer to initiate the connection (offer is a description of the local media)
export const createOffer = async (socket, roomId) => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", { roomId, offer });
};


export const handleOffer = async (socket, roomId, offer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  await addPendingIceCandidates();

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", { roomId, answer });
};

// Handle the answer from the other peer (answer is a description of the remote media)
export const handleAnswer = async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  await addPendingIceCandidates();
};


// Handle incoming ICE candidates from the other peer (ICE candidates are network information needed to establish a connection)
export const handleIceCandidate = async (candidate) => {
  if (!candidate) return;

  if (!peerConnection.remoteDescription) {
    pendingIceCandidates.push(candidate);
    return;
  }

  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};


// Clean up the peer connection when leaving the room
export const closePeerConnection = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  pendingIceCandidates = [];
};
