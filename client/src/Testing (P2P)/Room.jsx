import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import { socket } from "../sockets/socket";
import getLocalStream from "../webrtc/media";
import { 
  getProfile, 
  getMeetingDetails, 
  enterLobby, 
  setLobbyDisplayName, 
  admitParticipant, 
  denyParticipant,
  sendEmailInvite
} from "../lib/api";

import {
  addLocalTracks,
  closePeerConnection,
  createOffer,
  createPeerConnection,
  handleAnswer,
  handleIceCandidate,
  handleOffer,
  setRemoteSocketId,
} from "../webrtc/peer";

const VideoCard = ({ stream, label, isHost, muted, initials }) => (
  <div className="bg-[#1f3155] border border-border-brand border-solid flex-1 min-h-[300px] opacity-90 overflow-hidden relative rounded-card w-full flex items-center justify-center">
    {/* Video or Avatar Placeholder */}
    {stream ? (
      <VideoPlayer stream={stream} muted={muted} />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <img
          src="https://www.figma.com/api/mcp/asset/8e785da8-7cf9-4757-913d-f5c44ff56c5f"
          className="absolute min-w-[836px] min-h-[420px] object-cover opacity-50"
          alt=""
        />
        <div className="bg-bg-brand border border-icon-brand h-12 w-12 flex items-center justify-center rounded-full z-10 shadow-lg">
          <span className="text-text-inverse font-bold text-xl">{initials}</span>
        </div>
      </div>
    )}

    {/* User Label */}
    <div className="absolute border border-border-brand bottom-2 left-2 flex gap-2 items-center px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md z-20">
      <span className="text-text-inverse text-sm font-medium">{label}</span>
      <img
        src="https://www.figma.com/api/mcp/asset/b24c348e-5cc9-4484-9ac8-f2fd5c3fd46d"
        className="size-4 opacity-80"
        alt=""
      />
    </div>

    {/* Mute Status */}
    <div className="absolute bottom-2.5 right-4 size-6 z-20">
      <img
        src="https://www.figma.com/api/mcp/asset/a0940251-fb91-42aa-a06c-ff5f66cdc93d"
        className="size-full"
        alt="Muted"
      />
    </div>

    {/* Host Badge */}
    {isHost && (
      <div className="absolute border border-border-brand top-3 left-4 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md z-20">
        <span className="text-text-inverse text-xs font-semibold uppercase tracking-wider">Host</span>
      </div>
    )}
  </div>
);

const ControlBar = ({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onInviteClick,
  onLeaveClick,
}) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#18273b] border border-neutral-800/50 flex gap-4 md:gap-20 h-16 items-center px-6 md:px-12 rounded-2xl w-[95%] max-w-[1255px] justify-center z-50 shadow-2xl backdrop-blur-sm">
    <button 
      onClick={onToggleMic}
      className={`p-2 rounded-lg transition-colors cursor-pointer ${micEnabled ? "hover:bg-white/10" : "bg-danger-600 hover:bg-danger-500"}`}
      title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
    >
      <img src="https://www.figma.com/api/mcp/asset/08429db2-d345-46ba-bdbb-09b8e075ac74" className="size-8" alt="Mic" />
    </button>
    <button 
      onClick={onToggleCamera}
      className={`p-2 rounded-lg transition-colors cursor-pointer ${cameraEnabled ? "hover:bg-white/10" : "bg-danger-600 hover:bg-danger-500"}`}
      title={cameraEnabled ? "Stop Camera" : "Start Camera"}
    >
      <img src="https://www.figma.com/api/mcp/asset/45a53f7f-7525-47f3-a545-db0c06594e1b" className="size-8" alt="Video" />
    </button>
    <button className="hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer">
      <img src="https://www.figma.com/api/mcp/asset/a95395b3-b105-480f-9a51-55c10e42cb49" className="size-8" alt="Hand" />
    </button>
    <button className="hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer">
      <img src="https://www.figma.com/api/mcp/asset/325bbc2d-82d1-4606-83eb-72f564d66b35" className="size-8" alt="Chat" />
    </button>
    <button className="hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer">
      <img src="https://www.figma.com/api/mcp/asset/98a70ea7-c25f-42ed-8080-5235813de52e" className="size-8" alt="Record" />
    </button>
    <button className="hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer">
      <img src="https://www.figma.com/api/mcp/asset/39adc6e8-b863-4f2f-9302-718782376b63" className="size-8" alt="Present" />
    </button>
    <button 
      onClick={onInviteClick}
      className="hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
      title="Invite People"
    >
      <img src="https://www.figma.com/api/mcp/asset/e5329f5a-ce74-47f3-a989-2dda85ebe5ad" className="size-8" alt="Share" />
    </button>
    <button 
      onClick={onLeaveClick}
      className="bg-danger-600 hover:bg-danger-500 p-2 rounded-lg transition-colors cursor-pointer"
      title="Leave Meeting"
    >
      <svg className="size-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  </div>
);

const PreviewVideo = ({ stream }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  if (!stream) return null;
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover rounded-xl"
    />
  );
};

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerId, setPeerId] = useState(null);
  const [error, setError] = useState(null);
  const [clientId] = useState(() => Math.floor(100000 + Math.random() * 900000));

  const isInitiatorRef = useRef(false);
  const localStreamRef = useRef(null);
  const peerSocketIdRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [meeting, setMeeting] = useState(null);
  
  // Lobby-specific states
  const [lobbyStatus, setLobbyStatus] = useState("joined"); // "preview" | "waiting" | "denied" | "joined"
  const [isHost, setIsHost] = useState(false);
  const [displayName, setDisplayNameState] = useState("");
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [previewStream, setPreviewStream] = useState(null);

  // Waiting participants for Host lobby panel
  const [simulatedLobbyUsers, setSimulatedLobbyUsers] = useState([]);
  const [isLobbyPanelOpen, setIsLobbyPanelOpen] = useState(false);

  // Invite states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [isInviting, setIsInviting] = useState(false);


  // Fetch profile and meeting details
  useEffect(() => {
    const initLobby = async () => {
      try {
        const profileRes = await getProfile().catch(() => null);
        if (profileRes && profileRes.data) {
          const userObj = profileRes.data;
          setCurrentUser(userObj);
          setDisplayNameState(`${userObj.first_name || ""} ${userObj.last_name || ""}`.trim());
          
          const meetingRes = await getMeetingDetails(roomId).catch(() => null);
          if (meetingRes && meetingRes.data) {
            setMeeting(meetingRes.data);
            if (meetingRes.data.host_id === userObj.user_id) {
              setIsHost(true);
            }
          } else {
            // Fallback for instant meetings
            setIsHost(true);
          }

          // Auto-trigger call join to bypass preview page
          handleJoinCall();
        }
      } catch (err) {
        console.error("Failed to fetch meeting or profile details:", err);
        setIsHost(true);
        handleJoinCall();
      }
    };
    
    initLobby();
  }, [roomId]);

  // Enumerate devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(() => {});

        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const audios = deviceList.filter(d => d.kind === "audioinput");
        const videos = deviceList.filter(d => d.kind === "videoinput");
        
        setAudioDevices(audios);
        setVideoDevices(videos);
        
        if (audios.length > 0) setSelectedAudioDevice(audios[0].deviceId);
        if (videos.length > 0) setSelectedVideoDevice(videos[0].deviceId);
      } catch (err) {
        console.error("Failed to enumerate devices:", err);
      }
    };
    
    getDevices();
  }, []);

  // Update preview stream based on camera/mic states
  useEffect(() => {
    let activeStream = null;
    
    const startPreview = async () => {
      if (lobbyStatus !== "preview" || hasJoined) {
        if (previewStream) {
          previewStream.getTracks().forEach(track => track.stop());
          setPreviewStream(null);
        }
        return;
      }
      
      try {
        if (previewStream) {
          previewStream.getTracks().forEach(track => track.stop());
        }
        
        const constraints = {
          video: cameraEnabled ? (selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true) : false,
          audio: micEnabled ? (selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true) : false
        };
        
        if (constraints.video || constraints.audio) {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          activeStream = stream;
          setPreviewStream(stream);
        } else {
          setPreviewStream(null);
        }
      } catch (err) {
        console.error("Error setting up preview stream:", err);
      }
    };
    
    startPreview();
    
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedVideoDevice, selectedAudioDevice, cameraEnabled, micEnabled, lobbyStatus, hasJoined]);

  const handleLobbyJoin = async () => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
    }
    setLobbyStatus("joined");
    handleJoinCall();
  };

  // Simulation methods removed as requested

  const handleJoinCall = async () => {
    setIsJoining(true);
    setError(null);
    try {
      const constraints = {
        video: cameraEnabled ? (selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true) : false,
        audio: micEnabled ? (selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true) : false
      };
      
      const stream = await getLocalStream(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setHasJoined(true);
    } catch (mediaErr) {
      console.warn("Could not get local media stream:", mediaErr);
      setError("Camera/microphone access denied. Please allow access when prompted or check browser settings.");
      setIsJoining(false);
      setLobbyStatus("preview");
    }
  };

  const toggleMic = () => {
    const nextState = !micEnabled;
    setMicEnabled(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = nextState;
      });
    }
  };

  const toggleCamera = () => {
    const nextState = !cameraEnabled;
    setCameraEnabled(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = nextState;
      });
    }
  };

  const handleLeaveCall = () => {
    if (window.confirm("Are you sure you want to leave the meeting?")) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      navigate("/dashboard");
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        alert("Meeting link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
      });
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteSuccess(null);
    setInviteError(null);
    try {
      await sendEmailInvite(roomId, [inviteEmail.trim()]);
      setInviteSuccess(`Successfully sent invite to ${inviteEmail}`);
      setInviteEmail("");
    } catch (err) {
      console.error("Failed to send invite:", err);
      setInviteError(err.message || "Failed to send email invite.");
    } finally {
      setIsInviting(false);
    }
  };

  useEffect(() => {
    if (!hasJoined) return;

    const joinRoom = () => {
      console.log("Connected:", socket.id);
      socket.emit("join-room", { roomId, userId: clientId });
    };

    const start = async () => {
      try {
        createPeerConnection(socket, roomId, setRemoteStream);
        if (localStreamRef.current) {
          addLocalTracks(localStreamRef.current);
        }

        socket.on("connect", joinRoom);

        socket.on("joined-room", ({ isInitiator, peers = [] }) => {
          const peer = peers[0];
          isInitiatorRef.current = isInitiator;
          peerSocketIdRef.current = peer?.socketId || null;
          setRemoteSocketId(peerSocketIdRef.current);
          setPeerId(peer?.userId || null);

          // If Host, notify waiting peers in lobby
          if (meeting?.host_id && currentUser && meeting.host_id === currentUser.user_id) {
            peers.forEach(p => {
              socket.emit("answer", {
                roomId,
                targetSocketId: p.socketId,
                answer: {
                  type: "lobby-host-present"
                }
              });
            });
          }
        });

        socket.on("initiator", () => {
          console.log("You are the initiator");
          isInitiatorRef.current = true;
        });

        socket.on("user-joined", async ({ userId, socketId }) => {
          peerSocketIdRef.current = socketId;
          setRemoteSocketId(socketId);
          setPeerId(userId);

          if (!isInitiatorRef.current) return;

          console.log("User joined -> initiator sending offer");
          await createOffer(socket, roomId, socketId);
        });

        socket.on("offer", async ({ offer, senderSocketId, senderUserId }) => {
          if (offer?.type === "lobby-request") {
            // Add user to the waiting queue if host
            if (meeting?.host_id && currentUser && meeting.host_id === currentUser.user_id) {
              setSimulatedLobbyUsers(prev => {
                const exists = prev.some(u => u.user_id === offer.userId);
                if (exists) return prev;
                return [...prev, {
                  user_id: offer.userId,
                  first_name: offer.displayName,
                  last_name: "",
                  display_name: offer.displayName,
                  socketId: senderSocketId
                }];
              });
            }
            return;
          }
          console.log("Received offer -> sending answer");
          peerSocketIdRef.current = senderSocketId;
          setPeerId(senderUserId || senderSocketId);
          await handleOffer(socket, roomId, offer, senderSocketId);
        });

        socket.on("answer", async ({ answer, senderSocketId, senderUserId }) => {
          console.log("Received answer");
          peerSocketIdRef.current = senderSocketId;
          setRemoteSocketId(senderSocketId);
          setPeerId(senderUserId || senderSocketId);
          await handleAnswer(answer);
        });

        socket.on("ice-candidate", async ({ candidate, senderSocketId }) => {
          console.log("Received ICE candidate");
          if (senderSocketId) {
            peerSocketIdRef.current = senderSocketId;
            setRemoteSocketId(senderSocketId);
          }
          await handleIceCandidate(candidate);
        });

        socket.on("user-left", () => {
          console.log("User left");
          setPeerId(null);
          setRemoteStream(null);
          peerSocketIdRef.current = null;
          closePeerConnection();
          createPeerConnection(socket, roomId, setRemoteStream);
          if (localStreamRef.current) {
            addLocalTracks(localStreamRef.current);
          }
          isInitiatorRef.current = true;
        });

        socket.on("room-full", () => {
          setError("This demo room already has two people in it.");
        });

        socket.on("signal-error", ({ message }) => {
          console.error("WebRTC signal failed:", message);
          setError(message);
        });

        socket.on("connect_error", (err) => {
          console.error("Socket connection failed:", err.message);
          setError(err.message);
        });

        socket.connect();
        if (socket.connected) {
          joinRoom();
        }
      } catch (err) {
        console.error("Room setup failed:", err);
        setError(err.message);
      }
    };

    start();

    return () => {
      socket.off("connect");
      socket.off("joined-room");
      socket.off("initiator");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
      socket.off("room-full");
      socket.off("signal-error");
      socket.off("connect_error");
      socket.disconnect();
      closePeerConnection();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [hasJoined, clientId, roomId]);

  if (lobbyStatus === "preview" && !hasJoined) {
    return (
      <div className="bg-bg-canvas min-h-screen w-full flex flex-col items-center justify-center py-8 px-4 relative overflow-hidden text-text-primary font-body">
        {/* Ambient background glows using brand color tokens */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-4xl backdrop-blur-md bg-bg-surface/80 border border-border-subtle rounded-card p-6 md:p-8 shadow-2xl relative z-10 flex flex-col md:flex-row gap-8">
          {/* Left Column: Media Preview */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative aspect-video w-full bg-bg-subtle rounded-card border border-border-subtle overflow-hidden flex items-center justify-center shadow-inner group">
              {cameraEnabled && previewStream ? (
                <PreviewVideo stream={previewStream} />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="size-16 rounded-full bg-bg-elevated flex items-center justify-center text-2xl font-bold border border-border-subtle text-text-brand shadow-lg animate-pulse">
                    {displayName ? displayName[0]?.toUpperCase() : "U"}
                  </div>
                  <span className="text-sm text-text-secondary font-medium">Camera is turned off</span>
                </div>
              )}

              {/* Camera & Mic overlay controls */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-4 bg-bg-surface/90 backdrop-blur-md px-4 py-2 rounded-pill border border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setMicEnabled(!micEnabled)} 
                  className={`p-2 rounded-full transition-colors ${micEnabled ? "hover:bg-bg-elevated text-text-primary" : "bg-danger-100 text-danger-600 hover:bg-danger-500/20"}`}
                >
                  {micEnabled ? (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ) : (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  )}
                </button>
                <button 
                  onClick={() => setCameraEnabled(!cameraEnabled)} 
                  className={`p-2 rounded-full transition-colors ${cameraEnabled ? "hover:bg-bg-elevated text-text-primary" : "bg-danger-100 text-danger-600 hover:bg-danger-500/20"}`}
                >
                  {cameraEnabled ? (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mic Diagnostic check bar */}
            <div className="flex items-center gap-2 bg-bg-subtle border border-border-subtle p-3 rounded-control">
              <span className="text-xs text-text-secondary font-medium">Mic Level:</span>
              <div className="flex gap-1 h-3 flex-1 items-center px-1">
                {micEnabled ? (
                  [...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-bg-brand rounded-full transition-all duration-300"
                      style={{ 
                        height: `${Math.floor(Math.random() * 80) + 20}%`,
                        opacity: micEnabled ? 1 : 0.2
                      }}
                    ></div>
                  ))
                ) : (
                  <span className="text-xs text-danger-500 font-medium">Microphone is muted</span>
                )}
              </div>
            </div>

            {/* Invite / Add Users Section (Host Only) */}
            {isHost && (
              <div className="bg-bg-canvas border border-border-subtle p-4 rounded-card flex flex-col gap-3 shadow-inner mt-2">
                <div className="flex items-center gap-2">
                  <svg className="size-4.5 text-text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <h4 className="font-bold text-xs font-display text-text-primary uppercase tracking-wider">Invite Users to Room</h4>
                </div>
                
                {/* Link copy */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/room/${roomId}`}
                    className="flex-1 bg-bg-surface border border-border-subtle rounded-control p-2 text-xs text-text-primary focus:outline-none"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="bg-bg-subtle hover:bg-bg-elevated border border-border-subtle text-text-primary px-3 py-1.5 rounded-control text-xs font-semibold transition-colors cursor-pointer border-0"
                  >
                    Copy Link
                  </button>
                </div>

                {/* Email Invite */}
                <form onSubmit={handleSendInvite} className="flex gap-2">
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-bg-surface border border-border-subtle rounded-control p-2 text-xs text-text-primary focus:outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={isInviting}
                    className="bg-bg-brand hover:bg-bg-brand-hover text-text-inverse px-3 py-1.5 rounded-control text-xs font-bold transition-colors cursor-pointer border-0 disabled:opacity-50"
                  >
                    {isInviting ? "Inviting..." : "Send Invite"}
                  </button>
                </form>
                {inviteSuccess && <p className="text-[11px] text-success-700 font-medium">{inviteSuccess}</p>}
                {inviteError && <p className="text-[11px] text-danger-600 font-medium">{inviteError}</p>}
              </div>
            )}
          </div>

          {/* Right Column: Configurations & Action buttons */}
          <div className="flex-1 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-bg-subtle border border-border-subtle text-text-secondary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[4px]">
                  {isHost ? "Host" : "Guest"}
                </span>
                <span className="text-text-secondary text-xs">Room ID: {roomId}</span>
              </div>
              <h2 className="text-2xl font-bold font-display tracking-tight mb-4 text-text-primary">
                {meeting?.meeting_title || "Configure Settings"}
              </h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs font-semibold text-text-secondary uppercase tracking-wider">Your Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayNameState(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-bg-canvas border border-border-subtle rounded-control p-3 text-text-primary font-body focus:outline-none focus:border-border-brand transition-colors text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs font-semibold text-text-secondary uppercase tracking-wider">Camera Source</label>
                  <div className="relative">
                    <select
                      value={selectedVideoDevice}
                      onChange={(e) => setSelectedVideoDevice(e.target.value)}
                      className="w-full bg-bg-canvas border border-border-subtle rounded-control p-3 text-text-primary font-body focus:outline-none focus:border-border-brand transition-colors text-sm appearance-none pr-8"
                    >
                      {videoDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId} className="bg-bg-surface text-text-primary">
                          {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                        </option>
                      ))}
                      {videoDevices.length === 0 && <option value="" className="bg-bg-surface text-text-primary">No Camera Found</option>}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs font-semibold text-text-secondary uppercase tracking-wider">Microphone Source</label>
                  <div className="relative">
                    <select
                      value={selectedAudioDevice}
                      onChange={(e) => setSelectedAudioDevice(e.target.value)}
                      className="w-full bg-bg-canvas border border-border-subtle rounded-control p-3 text-text-primary font-body focus:outline-none focus:border-border-brand transition-colors text-sm appearance-none pr-8"
                    >
                      {audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId} className="bg-bg-surface text-text-primary">
                          {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                        </option>
                      ))}
                      {audioDevices.length === 0 && <option value="" className="bg-bg-surface text-text-primary">No Microphone Found</option>}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {error && <div className="text-xs text-danger-600 bg-danger-100 border border-danger-500/20 p-3 rounded-control">{error}</div>}
              
              <button
                onClick={handleLobbyJoin}
                className="w-full bg-bg-brand hover:bg-bg-brand-hover text-text-inverse font-body font-bold py-3.5 px-6 rounded-card transition-colors shadow-md active:translate-y-0 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isHost ? (
                  <>
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    Start Meeting as Host
                  </>
                ) : (
                  <>
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Request to Join Meeting
                  </>
                )}
              </button>
              
              <button 
                onClick={() => navigate("/dashboard")} 
                className="w-full bg-bg-subtle hover:bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary py-2.5 px-6 rounded-card transition-colors text-xs font-semibold cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-bg-canvas min-h-screen w-full flex flex-col items-center py-8 px-4 relative overflow-hidden text-text-primary font-body">
      {/* Top Header/Info */}
      <div className="absolute top-4 left-6 z-30 flex items-center gap-4">
        <h2 className="text-text-secondary text-sm font-medium tracking-tight">Room ID: {roomId}</h2>
        {isHost && (
          <span className="bg-bg-subtle border border-border-subtle text-text-secondary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[4px]">
            Host
          </span>
        )}
      </div>

      {isHost && (
        <div className="absolute top-4 right-6 z-30">
          <button 
            onClick={() => setIsLobbyPanelOpen(!isLobbyPanelOpen)}
            className="flex items-center gap-2 bg-bg-surface border border-border-subtle px-4 py-2 rounded-control text-text-primary hover:bg-bg-subtle transition-colors text-sm font-medium relative cursor-pointer"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Lobby Queue</span>
            {simulatedLobbyUsers.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-danger-500 text-white text-[10px] font-bold size-5 flex items-center justify-center rounded-full animate-pulse">
                {simulatedLobbyUsers.length}
              </span>
            )}
          </button>
        </div>
      )}

      {isHost && isLobbyPanelOpen && (
        <div className="fixed right-4 top-16 w-80 bg-bg-surface/95 border border-border-subtle rounded-card p-4 z-40 shadow-2xl backdrop-blur-md text-text-primary">
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-2">
            <h3 className="font-bold text-lg font-display text-text-primary">Waiting Room</h3>
            <button onClick={() => setIsLobbyPanelOpen(false)} className="text-text-secondary hover:text-text-primary cursor-pointer">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {simulatedLobbyUsers.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">No one is waiting in the lobby.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
              {simulatedLobbyUsers.map((user) => (
                <div key={user.user_id} className="flex flex-col gap-2 p-3 bg-bg-subtle border border-border-subtle rounded-control">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold text-text-primary border border-border-subtle uppercase">
                      {user.first_name?.[0] || "U"}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">{user.display_name || `${user.first_name} ${user.last_name}`}</h4>
                      <p className="text-[10px] text-text-secondary">Requesting entry...</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={async () => {
                        try {
                          await admitParticipant(roomId, user.user_id);
                          if (user.socketId) {
                            socket.emit("answer", {
                              roomId,
                              targetSocketId: user.socketId,
                              answer: {
                                type: "lobby-admitted"
                              }
                            });
                          }
                          setSimulatedLobbyUsers(prev => prev.filter(u => u.user_id !== user.user_id));
                        } catch (err) {
                          console.error("Admit failed:", err);
                          setSimulatedLobbyUsers(prev => prev.filter(u => u.user_id !== user.user_id));
                        }
                      }}
                      className="flex-1 bg-state-success hover:bg-success-700 text-text-inverse text-xs font-semibold py-1.5 rounded-[12px] transition-colors cursor-pointer border-0"
                    >
                      Admit
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await denyParticipant(roomId, user.user_id);
                          if (user.socketId) {
                            socket.emit("answer", {
                              roomId,
                              targetSocketId: user.socketId,
                              answer: {
                                type: "lobby-denied"
                              }
                            });
                          }
                          setSimulatedLobbyUsers(prev => prev.filter(u => u.user_id !== user.user_id));
                        } catch (err) {
                          console.error("Deny failed:", err);
                          setSimulatedLobbyUsers(prev => prev.filter(u => u.user_id !== user.user_id));
                        }
                      }}
                      className="flex-1 bg-state-danger hover:bg-danger-700 text-text-inverse text-xs font-semibold py-1.5 rounded-[12px] transition-colors cursor-pointer border-0"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-2 border-t border-border-subtle text-[10px] text-text-secondary text-center leading-normal">
            Note: Admitting will call the backend API and add the user to the participant list.
          </div>
        </div>
      )}

      {error && (
        <div className="bg-danger-100 border border-danger-500/20 text-danger-600 px-4 py-2 rounded-control mb-4 z-40 max-w-[737px] text-center text-sm font-medium">
          {error}
        </div>
      )}

      {/* Video Grid */}
      <div className="flex flex-col gap-8 w-full max-w-[737px] h-[666px] mt-8 z-10">
        <VideoCard
          stream={localStream}
          label="You"
          isHost={isInitiatorRef.current}
          muted={true}
          initials="ME"
        />

        <VideoCard
          stream={remoteStream}
          label={peerId ? `User ${peerId}` : "Waiting..."}
          isHost={!isInitiatorRef.current && peerId !== null}
          muted={false}
          initials={peerId ? "U" : "?"}
        />
      </div>

      <ControlBar 
        micEnabled={micEnabled}
        cameraEnabled={cameraEnabled}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onInviteClick={() => setIsInviteOpen(true)}
        onLeaveClick={handleLeaveCall}
      />

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface border border-border-subtle rounded-card w-full max-w-md p-6 shadow-2xl relative text-text-primary">
            <button 
              onClick={() => {
                setIsInviteOpen(false);
                setInviteSuccess(null);
                setInviteError(null);
              }}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary cursor-pointer border-0 bg-transparent"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="font-bold text-lg font-display text-text-primary mb-2">Invite People</h3>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Share this meeting room details with others so they can join you.
            </p>

            {/* Link Copy Box */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">Meeting Link</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/room/${roomId}`}
                  className="flex-1 bg-bg-canvas border border-border-subtle rounded-control p-2.5 text-xs text-text-primary focus:outline-none"
                />
                <button 
                  onClick={handleCopyLink}
                  className="bg-bg-brand hover:bg-bg-brand-hover text-text-inverse px-4 py-2.5 rounded-control text-xs font-bold transition-colors cursor-pointer border-0"
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Email Invite Box */}
            {isHost ? (
              <form onSubmit={handleSendInvite} className="flex flex-col gap-3 pt-4 border-t border-border-subtle">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body font-semibold">Invite via Email</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-bg-canvas border border-border-subtle rounded-control p-2.5 text-xs text-text-primary focus:outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={isInviting}
                    className="bg-bg-brand hover:bg-bg-brand-hover text-text-inverse px-4 py-2.5 rounded-control text-xs font-bold transition-colors cursor-pointer border-0 disabled:opacity-50"
                  >
                    {isInviting ? "Sending..." : "Send Invite"}
                  </button>
                </div>
                {inviteSuccess && <p className="text-xs text-success-700 font-medium mt-1">{inviteSuccess}</p>}
                {inviteError && <p className="text-xs text-danger-600 font-medium mt-1">{inviteError}</p>}
              </form>
            ) : (
              <div className="pt-4 border-t border-border-subtle text-xs text-text-secondary text-center leading-normal">
                Only the host can send direct email invitations.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
