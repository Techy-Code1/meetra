import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../sockets/socket";
import {
  getProfile,
  getMeetingDetails,
  enterLobby,
  setLobbyDisplayName,
  admitParticipant,
  denyParticipant,
  sendEmailInvite,
  generateInviteLink,
  cancelMeeting,
  endMeeting,
  updateSchedule,
  getMeetingParticipants,
} from "../lib/api";
import Button from "../components/ui/Button";
import Sidebar from "../components/dashboard/Sidebar";
import TopBar from "../components/dashboard/TopBar";

export default function Lobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [displayName, setDisplayNameState] = useState("");
  const [hasEnteredLobby, setHasEnteredLobby] = useState(false);
  const [lobbyStatus, setLobbyStatus] = useState("loading"); // loading, preview, waiting, admitted, denied
  
  // Host state
  const [waitingList, setWaitingList] = useState([]); // [{ userId, socketId, displayName }]
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  // Edit and cancel meeting states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editMaxParticipants, setEditMaxParticipants] = useState("");
  const [editIsRecorded, setEditIsRecorded] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Refs for tracking sockets and polling
  const pollingIntervalRef = useRef(null);
  const waitingListRef = useRef([]);

  // Sync ref to prevent stale closures in socket events
  useEffect(() => {
    waitingListRef.current = waitingList;
  }, [waitingList]);

  // Fetch initial profile & meeting details
  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await getProfile().catch(() => null);
        if (profileRes && profileRes.data) {
          const userObj = profileRes.data;
          setCurrentUser(userObj);
          const fullName = `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim() || userObj.email;
          setDisplayNameState(fullName);
          
          const meetingRes = await getMeetingDetails(roomId).catch(() => null);
          if (meetingRes && meetingRes.data) {
            const m = meetingRes.data;
            setMeeting(m);
            setEditTitle(m.meeting_title || "");
            setEditDesc(m.description || "");
            if (m.scheduled_at) {
              const d = new Date(m.scheduled_at);
              const tzoffset = d.getTimezoneOffset() * 60000;
              const localISO = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
              setEditScheduledAt(localISO);
            }
            setEditMaxParticipants(m.max_participants || "");
            setEditIsRecorded(m.is_recorded || false);
            
            if (meetingRes.data.host_id === userObj.user_id) {
              setIsHost(true);
              setLobbyStatus("admitted"); // Host is always admitted
            } else {
              setIsHost(false);
              
              // Check if already admitted as participant in the meeting model
              const participants = meetingRes.data.participants || [];
              const admitted = participants.some(
                p => p.user_id === userObj.user_id && p.left_at === null
              );
              
              if (admitted) {
                setLobbyStatus("admitted");
                setHasEnteredLobby(true);
              } else {
                // Not admitted yet, enter lobby automatically!
                try {
                  await setLobbyDisplayName(roomId, fullName);
                  await enterLobby(roomId);
                  setHasEnteredLobby(true);
                  setLobbyStatus("waiting");
                } catch (e) {
                  console.error("Auto lobby entry failed:", e);
                  setHasEnteredLobby(true);
                  setLobbyStatus("waiting");
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load lobby data:", err);
      }
    };
    init();
  }, [roomId]);

  // Socket connection & handlers setup
  useEffect(() => {
    if (!currentUser) return;

    const setupSocket = () => {
      // Clean previous listeners
      socket.off("connect");
      socket.off("joined-room");
      socket.off("offer");
      socket.off("answer");

      socket.on("connect", () => {
        console.log("Lobby socket connected:", socket.id);
        socket.emit("join-room", { roomId, userId: currentUser.user_id });
      });

      socket.on("joined-room", ({ peers }) => {
        console.log("Joined room socket room, active peers:", peers);
        
        // If guest just joined, send request to the host
        if (!isHost) {
          // Find host in active peers
          const hostPeer = peers.find(p => p.userId === meeting?.host_id);
          if (hostPeer) {
            socket.emit("offer", {
              roomId,
              targetSocketId: hostPeer.socketId,
              offer: {
                type: "lobby-request",
                userId: currentUser.user_id,
                displayName: displayName,
              }
            });
          }
        } else {
          // As Host, let any existing guest know we are here
          peers.forEach(peer => {
            if (peer.userId !== currentUser.user_id) {
              // Tell them to send lobby request
              socket.emit("answer", {
                roomId,
                targetSocketId: peer.socketId,
                answer: {
                  type: "lobby-host-present"
                }
              });
            }
          });
        }
      });

      // Handle relayed messages via offer/answer channels
      socket.on("offer", ({ offer, senderSocketId }) => {
        if (isHost && offer?.type === "lobby-request") {
          console.log("Received lobby request from user:", offer.userId);
          // Check if already in list
          const exists = waitingListRef.current.some(item => item.userId === offer.userId);
          if (!exists) {
            setWaitingList(prev => [...prev, {
              userId: offer.userId,
              socketId: senderSocketId,
              displayName: offer.displayName
            }]);
          }
        }
      });

      socket.on("answer", ({ answer, senderSocketId }) => {
        if (!isHost) {
          if (answer?.type === "lobby-admitted") {
            console.log("Admitted by host!");
            setLobbyStatus("admitted");
          } else if (answer?.type === "lobby-denied") {
            console.log("Denied by host!");
            setLobbyStatus("denied");
          } else if (answer?.type === "lobby-host-present") {
            // Send request to host
            socket.emit("offer", {
              roomId,
              targetSocketId: senderSocketId,
              offer: {
                type: "lobby-request",
                userId: currentUser.user_id,
                displayName: displayName,
              }
            });
          }
        }
      });

      socket.connect();
    };

    // If host, connect immediately. If guest, wait until they submit displayName & join lobby.
    if (isHost || hasEnteredLobby) {
      setupSocket();
    }

    return () => {
      socket.off("connect");
      socket.off("joined-room");
      socket.off("offer");
      socket.off("answer");
      socket.disconnect();
    };
  }, [currentUser, isHost, hasEnteredLobby, meeting, displayName, roomId, navigate]);

  // Polling for meeting details & guest admission check
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await getMeetingDetails(roomId).catch(() => null);
        if (res && res.data) {
          setMeeting(res.data);
          
          if (!isHost && currentUser) {
            const participants = res.data.participants || [];
            const admitted = participants.some(
              p => p.user_id === currentUser.user_id && p.left_at === null
            );
            if (admitted) {
              setLobbyStatus("admitted");
            }
          }
        }
      } catch (err) {
        console.error("Polling check failed:", err);
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 3000);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [isHost, lobbyStatus, currentUser, roomId, navigate]);

  // ── Actions ──

  const handleAdmit = async (guestUserId, guestSocketId) => {
    try {
      await admitParticipant(roomId, guestUserId);
      
      // Notify guest over socket
      if (guestSocketId) {
        socket.emit("answer", {
          roomId,
          targetSocketId: guestSocketId,
          answer: {
            type: "lobby-admitted"
          }
        });
      }
      // Remove from list
      setWaitingList(prev => prev.filter(item => item.userId !== guestUserId));
    } catch (err) {
      console.error("Failed to admit user:", err);
    }
  };

  const handleDeny = async (guestUserId, guestSocketId) => {
    try {
      await denyParticipant(roomId, guestUserId);

      // Notify guest over socket
      if (guestSocketId) {
        socket.emit("answer", {
          roomId,
          targetSocketId: guestSocketId,
          answer: {
            type: "lobby-denied"
          }
        });
      }
      // Remove from list
      setWaitingList(prev => prev.filter(item => item.userId !== guestUserId));
    } catch (err) {
      console.error("Failed to deny user:", err);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/lobby/${roomId}`;
      await navigator.clipboard.writeText(url);
      setInviteSuccess("Meeting Lobby link copied!");
      setTimeout(() => setInviteSuccess(""), 3000);
    } catch {
      setInviteError("Failed to copy link.");
      setTimeout(() => setInviteError(""), 3000);
    }
  };


  const handleCancelMeetingSubmit = async (e) => {
    e.preventDefault();
    try {
      await cancelMeeting(roomId, cancelReason);
      setShowCancelModal(false);
      setCancelReason("");
      alert("Meeting cancelled successfully");
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to cancel meeting:", err);
      setInviteError(err.message || "Failed to cancel meeting.");
      setTimeout(() => setInviteError(""), 3000);
    }
  };

  const handleEndMeeting = async () => {
    if (!confirm("Are you sure you want to end this meeting for everyone?")) return;
    try {
      await endMeeting(roomId);
      alert("Meeting ended successfully");
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to end meeting:", err);
      setInviteError(err.message || "Failed to end meeting.");
      setTimeout(() => setInviteError(""), 3000);
    }
  };

  const handleUpdateMeetingSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        meeting_title: editTitle,
        description: editDesc,
        scheduled_at: new Date(editScheduledAt).toISOString(),
        max_participants: editMaxParticipants ? parseInt(editMaxParticipants, 10) : null,
        is_recorded: editIsRecorded,
      };
      
      let updated;
      if (meeting?.status === "scheduled") {
        updated = await updateSchedule(roomId, payload);
      } else {
        // Ongoing or others
        updated = await updateMeeting(roomId, payload);
      }
      
      if (updated && updated.data) {
        setMeeting(prev => ({
          ...prev,
          ...updated.data
        }));
      }
      
      setShowEditModal(false);
      setInviteSuccess("Meeting details updated successfully!");
      setTimeout(() => setInviteSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to update meeting:", err);
      setInviteError(err.message || "Failed to update meeting.");
      setTimeout(() => setInviteError(""), 3000);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteSuccess("");
    setInviteError("");

    try {
      await sendEmailInvite(roomId, inviteEmail);
      setInviteSuccess(`Invitation email sent to ${inviteEmail}!`);
      setInviteEmail("");
      setTimeout(() => setInviteSuccess(""), 4000);
    } catch (err) {
      setInviteError(err.message || "Failed to send email invitation.");
      setTimeout(() => setInviteError(""), 4000);
    } finally {
      setIsInviting(false);
    }
  };

  // ── Render Views ──

  // 1. Guest WAITING room view (Waiting for Host Approval)
  if (!isHost && lobbyStatus === "waiting") {
    return (
      <div className="bg-bg-canvas min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden text-text-primary font-body">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md backdrop-blur-md bg-bg-surface/80 border border-border-subtle rounded-card p-8 shadow-2xl relative z-10 flex flex-col items-center gap-6 text-center">
          {/* Pulsing loading avatar stack */}
          <div className="relative">
            <div className="size-20 rounded-full bg-bg-subtle border border-border-subtle flex items-center justify-center shadow-lg relative z-10">
              <img
                src={meeting?.host?.profile_picture_url || "https://www.figma.com/api/mcp/asset/67753a3d-3549-4da3-b837-ca8737b2faf5"}
                className="size-16 rounded-full object-cover"
                alt="Host Avatar"
              />
            </div>
            <div className="absolute inset-0 bg-bg-brand/20 rounded-full animate-ping opacity-75"></div>
          </div>

          <div>
            <h2 className="text-xl font-bold font-display text-text-primary mb-2">Waiting for Host to Admit You...</h2>
            <p className="text-sm text-text-secondary px-4">
              You've requested to join <strong className="text-text-primary">{meeting?.meeting_title}</strong>. Please wait while the host reviews your entry request.
            </p>
          </div>

          <div className="w-full border-t border-border-subtle pt-4 text-xs text-text-secondary flex flex-col gap-2">
            <div>Displaying as: <strong className="text-text-primary">{displayName}</strong></div>
            <div>Meeting ID: <span className="font-mono">{roomId}</span></div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-2 text-xs text-danger-600 hover:text-danger-500 font-semibold transition-colors cursor-pointer bg-transparent border-0"
          >
            Cancel Request & Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 3. Guest DENIED entry view
  if (!isHost && lobbyStatus === "denied") {
    return (
      <div className="bg-bg-canvas min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden text-text-primary font-body">
        <div className="w-full max-w-md backdrop-blur-md bg-bg-surface/80 border border-danger-500/20 rounded-card p-8 shadow-2xl relative z-10 flex flex-col items-center gap-6 text-center">
          <div className="size-16 rounded-full bg-danger-100 flex items-center justify-center text-danger-600">
            <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold font-display text-danger-700 mb-2">Entry Request Denied</h2>
            <p className="text-sm text-text-secondary px-4">
              The meeting host denied your request to join <strong className="text-text-primary">{meeting?.meeting_title}</strong>.
            </p>
          </div>

          <Button
            onClick={() => navigate("/dashboard")}
            variant="primary"
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // 4. Unified LOBBY dashboard view (for Host or Admitted guests)
  if (isHost || lobbyStatus === "admitted") {
    const approvedParticipants = (meeting?.participants || []).filter(
      p => p.user_id !== meeting?.host_id && p.left_at === null
    );

    const isHostInCall = (meeting?.participants || []).some(
      p => p.user_id === meeting?.host_id && p.left_at === null
    );

    const hostName = meeting?.host
      ? `${meeting.host.first_name || ""} ${meeting.host.last_name || ""}`.trim() || meeting.host.email
      : "Loading...";

    return (
      <div className="flex min-h-screen bg-bg-canvas text-text-primary">
        <Sidebar />
        <main className="flex flex-1 flex-col lg:pl-[300px]">
          <TopBar 
            userName={currentUser ? currentUser.first_name : "User"} 
            meetingCount={1} 
          />
          
          <div className="flex flex-1 flex-col gap-8 p-4 lg:flex-row lg:p-6">
            {/* Left Content Area */}
            <div className="flex flex-1 flex-col gap-8">
              {/* Header Card */}
              <div className="bg-bg-surface border border-border-subtle rounded-[12px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {isHost ? (
                      <span className="bg-bg-brand/10 text-text-brand border border-bg-brand/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[4px]">
                        Room Host
                      </span>
                    ) : (
                      <span className="bg-success-100 text-success-800 border border-success-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[4px]">
                        Admitted Guest
                      </span>
                    )}
                    <span className="text-text-secondary text-xs">Room ID: {roomId}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-2xl font-bold font-display tracking-tight text-text-primary">
                      Lobby: {meeting?.meeting_title || "Loading..."}
                    </h2>
                    {isHost && (
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="text-text-secondary hover:text-text-brand transition-colors p-1"
                        title="Edit Meeting Details"
                      >
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">
                    Hosted by: <span className="font-semibold text-text-primary">{hostName}</span>
                  </p>
                </div>

                {isHost ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => navigate(`/room/${roomId}`)}
                      variant="primary"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                      Start / Enter Call Room
                    </Button>
                    {meeting?.status === "scheduled" ? (
                      <Button
                        onClick={() => setShowCancelModal(true)}
                        variant="secondary"
                        className="border-danger-500/30 hover:border-danger-500 hover:bg-danger-500/10 text-danger-600 justify-center"
                      >
                        Cancel Meeting
                      </Button>
                    ) : meeting?.status === "ongoing" ? (
                      <Button
                        onClick={handleEndMeeting}
                        variant="secondary"
                        className="border-danger-500/30 hover:border-danger-500 hover:bg-danger-500/10 text-danger-600 justify-center"
                      >
                        End Meeting
                      </Button>
                    ) : null}
                  </div>
                ) : isHostInCall ? (
                  <Button
                    onClick={() => navigate(`/room/${roomId}`)}
                    variant="primary"
                  >
                    Join Call Room
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled
                    className="opacity-75 cursor-not-allowed text-xs py-2 px-4"
                  >
                    Waiting for host to start call...
                  </Button>
                )}
              </div>

              {/* Host and Approved Participants Section */}
              <section className="flex flex-col gap-4">
                <h3 className="font-display text-base font-bold text-text-secondary uppercase tracking-wider">
                  Room Members
                </h3>

                {/* Host Card Indicator */}
                <div className="bg-bg-surface border border-border-brand/30 rounded-[12px] p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-bg-brand/10 border border-bg-brand/20 flex items-center justify-center font-bold text-text-brand text-sm shadow-sm">
                      {meeting?.host?.first_name ? meeting.host.first_name[0]?.toUpperCase() : "H"}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text-primary">{hostName}</span>
                      <span className="text-xs text-text-brand font-semibold">
                        Meeting Host {isHostInCall ? "(Active in call)" : "(Lobby / Offline)"}
                      </span>
                    </div>
                  </div>
                  <span className="bg-bg-brand/10 text-text-brand border border-bg-brand/20 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-[4px]">
                    Host
                  </span>
                </div>

                <div className="border-t border-border-subtle my-2"></div>

                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Approved Participants ({approvedParticipants.length})
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  {approvedParticipants.length === 0 ? (
                    <div className="col-span-2 flex flex-col items-center justify-center p-8 text-center bg-bg-surface border border-dashed border-border-subtle rounded-[12px] text-text-secondary text-sm">
                      <p className="font-semibold text-text-primary mb-1">No other participants approved yet</p>
                      {isHost && <p className="text-xs">Invite users using the panel on the right.</p>}
                    </div>
                  ) : (
                    approvedParticipants.map((p) => {
                      const name = `${p.user?.first_name || ""} ${p.user?.last_name || ""}`.trim() || p.user?.email || "User";
                      return (
                        <div 
                          key={p.id || p.user_id} 
                          className="bg-bg-surface border border-border-subtle rounded-[12px] p-4 flex items-center justify-between shadow-sm hover:border-border-brand/40 transition-all duration-fast"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-success-100 border border-success-200 flex items-center justify-center font-bold text-success-700 text-sm shadow-sm uppercase">
                              {name ? name[0] : "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-text-primary">{name}</span>
                              <span className="text-xs text-text-secondary">Approved / In Lobby</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-success-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            {/* Right Invite Column */}
            <div className="w-full lg:w-[320px] flex flex-col gap-4">
              <h3 className="font-display text-base font-bold text-text-secondary uppercase tracking-wider">
                Lobby Info
              </h3>

              {isHost ? (
                <div className="bg-bg-surface border border-border-subtle p-5 rounded-[12px] flex flex-col gap-5 shadow-sm">
                  {/* Share Link */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Share Invite Link</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/lobby/${roomId}`}
                        className="flex-1 bg-bg-canvas border border-border-subtle rounded-[8px] p-2 text-xs text-text-primary focus:outline-none"
                      />
                      <Button 
                        onClick={handleCopyLink}
                        variant="secondary"
                        className="h-[36px] px-3.5 text-xs"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  {/* Email Invite */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Invite via Email</label>
                    <form onSubmit={handleSendInvite} className="flex gap-2">
                      <input 
                        type="email" 
                        required
                        placeholder="name@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 bg-bg-canvas border border-border-subtle rounded-[8px] p-2 text-xs text-text-primary focus:outline-none"
                      />
                      <Button 
                        type="submit"
                        disabled={isInviting}
                        variant="primary"
                        className="h-[36px] px-3.5 text-xs"
                      >
                        {isInviting ? "Inviting..." : "Send"}
                      </Button>
                    </form>
                  </div>

                  {inviteSuccess && <p className="text-[11px] text-success-700 font-medium">{inviteSuccess}</p>}
                  {inviteError && <p className="text-[11px] text-danger-600 font-medium">{inviteError}</p>}
                </div>
              ) : (
                <div className="bg-bg-surface border border-border-subtle p-5 rounded-[12px] flex flex-col gap-3 shadow-sm text-xs text-text-secondary leading-normal">
                  <div className="flex items-center gap-2 font-semibold text-text-primary mb-1">
                    <svg className="size-4 text-text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Guest Permissions
                  </div>
                  <p>Only the meeting host can invite other participants or initiate the call room.</p>
                  <p className="bg-bg-canvas p-2.5 rounded-[8px] border border-border-subtle font-mono text-[11px] break-all select-all">
                    Room: {roomId}
                  </p>
                </div>
              )}

              <Button
                variant="secondary"
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
          
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
              <div className="bg-bg-surface border border-border-subtle rounded-[16px] w-full max-w-md p-6 flex flex-col gap-4 shadow-xl animate-in fade-in zoom-in-95 duration-fast">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-lg font-bold text-text-primary">Edit Meeting Details</h3>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="text-text-secondary hover:text-text-primary p-1 bg-transparent border-0 cursor-pointer"
                  >
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleUpdateMeetingSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Title</label>
                    <input 
                      type="text" 
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-bg-canvas border border-border-subtle rounded-[8px] p-2.5 text-xs text-text-primary focus:outline-none focus:border-border-focus"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows="3"
                      className="bg-bg-canvas border border-border-subtle rounded-[8px] p-2.5 text-xs text-text-primary focus:outline-none focus:border-border-focus resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Scheduled At</label>
                    <input 
                      type="datetime-local"
                      required
                      value={editScheduledAt}
                      onChange={(e) => setEditScheduledAt(e.target.value)}
                      className="bg-bg-canvas border border-border-subtle rounded-[8px] p-2.5 text-xs text-text-primary focus:outline-none focus:border-border-focus"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Max Participants</label>
                    <input 
                      type="number" 
                      value={editMaxParticipants}
                      onChange={(e) => setEditMaxParticipants(e.target.value)}
                      placeholder="No limit"
                      className="bg-bg-canvas border border-border-subtle rounded-[8px] p-2.5 text-xs text-text-primary focus:outline-none focus:border-border-focus"
                    />
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <input 
                      type="checkbox" 
                      id="editIsRecorded"
                      checked={editIsRecorded}
                      onChange={(e) => setEditIsRecorded(e.target.checked)}
                      className="rounded border-border-subtle text-bg-brand focus:ring-bg-brand"
                    />
                    <label htmlFor="editIsRecorded" className="text-xs text-text-secondary font-medium">Record this meeting</label>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setShowEditModal(false)}
                      className="h-9 px-4 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      className="h-9 px-4 text-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showCancelModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
              <div className="bg-bg-surface border border-border-subtle rounded-[16px] w-full max-w-sm p-6 flex flex-col gap-4 shadow-xl animate-in fade-in zoom-in-95 duration-fast">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-lg font-bold text-text-primary">Cancel Meeting</h3>
                  <button 
                    onClick={() => setShowCancelModal(false)}
                    className="text-text-secondary hover:text-text-primary p-1 bg-transparent border-0 cursor-pointer"
                  >
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCancelMeetingSubmit} className="flex flex-col gap-4">
                  <p className="text-xs text-text-secondary leading-normal">
                    Are you sure you want to cancel this meeting? This will notify invitees and prevent participants from joining.
                  </p>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Cancellation Reason</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Schedule conflict (optional)"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="bg-bg-canvas border border-border-subtle rounded-[8px] p-2.5 text-xs text-text-primary focus:outline-none focus:border-border-focus"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setShowCancelModal(false)}
                      className="h-9 px-4 text-xs"
                    >
                      Go Back
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      className="h-9 px-4 text-xs bg-danger-600 hover:bg-danger-700 border-danger-600 hover:border-danger-700 text-text-inverse"
                    >
                      Confirm Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Fallback while loading
  return (
    <div className="min-h-screen bg-bg-canvas flex items-center justify-center text-text-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-bg-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Loading lobby details...</p>
      </div>
    </div>
  );
}
