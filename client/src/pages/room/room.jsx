import { useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";

import RoomFooter from "./components/RoomFooter";
import RoomHeader from "./components/RoomHeader";
import RoomSidebar from "./components/RoomSidebar";
import VideoStage from "./components/VideoStage";
import { INITIAL_MESSAGES, ROOM_DETAILS } from "./data/roomMockData";
import { socket } from "../../sockets/socket";

const ROOM_ID = ROOM_DETAILS.id;
const CLIENT_ID =
  window.sessionStorage.getItem("meetra-client-id") ||
  `Guest-${Math.random().toString(36).slice(2, 6)}`;

window.sessionStorage.setItem("meetra-client-id", CLIENT_ID);

const createLocalParticipant = (stream = null) => ({
  id: "local",
  socketId: null,
  userId: CLIENT_ID,
  initials: ROOM_DETAILS.profileInitials,
  name: "You",
  role: "Host",
  isLocal: true,
  mic: true,
  cam: true,
  talking: false,
  stream,
});

const createInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "GU";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const createRemoteParticipant = ({ socketId, userId, mic = true, cam = true }) => {
  if (!socketId) return null;

  const fallbackName = `Guest ${socketId?.slice(-4) || ""}`.trim();
  const name = userId || fallbackName;

  return {
    id: `remote:${socketId}`,
    socketId,
    userId: userId || socketId,
    initials: createInitials(name),
    name,
    role: "Guest",
    isLocal: false,
    mic,
    cam,
    talking: false,
    stream: null,
  };
};

const isSameParticipant = (participant, participantId) =>
  participant.id === participantId || participant.socketId === participantId;

const emitWithAck = (event, payload) =>
  new Promise((resolve, reject) => {
    socket.emit(event, payload, (response = {}) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response);
    });
  });

const upsertParticipant = (participants, participant) => {
  if (!participant) return participants;

  const existingIndex = participants.findIndex(
    (currentParticipant) =>
      currentParticipant.id === participant.id ||
      (participant.socketId &&
        currentParticipant.socketId === participant.socketId),
  );

  if (existingIndex === -1) {
    return [...participants, participant];
  }

  return participants.map((currentParticipant, index) =>
    index === existingIndex
      ? { ...currentParticipant, ...participant }
      : currentParticipant,
  );
};

const getUniqueParticipants = (participants) => {
  const uniqueParticipants = [];
  const seenKeys = new Set();

  participants.forEach((participant) => {
    if (!participant) return;

    const uniqueKey = participant.isLocal
      ? "local"
      : participant.socketId || participant.id;

    if (!uniqueKey || seenKeys.has(uniqueKey)) return;

    seenKeys.add(uniqueKey);
    uniqueParticipants.push(participant);
  });

  return uniqueParticipants;
};

const stopStreamTracks = (stream) => {
  stream?.getTracks().forEach((track) => track.stop());
};

export default function Room() {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [shareOn, setShareOn] = useState(false);
  const [handOn, setHandOn] = useState(false);
  const [layout, setLayout] = useState("grid");
  const [focusedId, setFocusedId] = useState(null);
  const [sidebarTab, setSidebarTab] = useState(null);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [chatBadge, setChatBadge] = useState(0);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [joinCodeCopied, setJoinCodeCopied] = useState(false);
  const [participants, setParticipants] = useState([createLocalParticipant()]);
  const [localStream, setLocalStream] = useState(null);
  const messagesEndRef = useRef(null);
  const inviteResetRef = useRef(null);
  const joinCodeResetRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const remoteStreamsRef = useRef(new Map());
  const mediaStateRef = useRef({ mic: true, cam: true });
  const setupStartedRef = useRef(false);
  const pendingProducersRef = useRef([]);
  const consumedProducerIdsRef = useRef(new Set());

  useEffect(() => {
    if (sidebarTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sidebarTab]);

  useEffect(() => {
    return () => {
      if (inviteResetRef.current) {
        window.clearTimeout(inviteResetRef.current);
      }

      if (joinCodeResetRef.current) {
        window.clearTimeout(joinCodeResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    const startLocalMedia = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            frameRate: { ideal: 24, max: 30 },
            facingMode: "user",
          },
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setLocalStream(stream);
        setParticipants((currentParticipants) =>
          currentParticipants.map((participant) =>
            participant.isLocal ? { ...participant, stream } : participant,
          ),
        );
      } catch (error) {
        console.error("Could not access camera or microphone.", error);
      }
    };

    startLocalMedia();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!localStream) return;

    mediaStateRef.current = { mic: micOn, cam: camOn };

    localStream.getAudioTracks().forEach((track) => {
      track.enabled = micOn;
    });
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = camOn;
    });

    if (socket.connected) {
      socket.emit("participant-media-state", {
        roomId: ROOM_ID,
        mic: mediaStateRef.current.mic,
        cam: mediaStateRef.current.cam,
      });
    }
  }, [camOn, localStream, micOn]);

  useEffect(() => {
    if (!localStream) return undefined;

    if (setupStartedRef.current) return undefined;

    setupStartedRef.current = true;
    let cancelled = false;
    const consumedProducerIds = consumedProducerIdsRef.current;

    const createTransport = async (device, direction) => {
      const transportOptions = await emitWithAck("create-transport", {
        roomId: ROOM_ID,
        direction,
      });

      const transport =
        direction === "send"
          ? device.createSendTransport(transportOptions)
          : device.createRecvTransport(transportOptions);

      transport.on("connect", ({ dtlsParameters }, callback, errback) => {
        emitWithAck("connect-transport", {
          transportId: transport.id,
          dtlsParameters,
        })
          .then(callback)
          .catch(errback);
      });

      if (direction === "send") {
        transport.on("produce", ({ kind, rtpParameters }, callback, errback) => {
          emitWithAck("produce", {
            roomId: ROOM_ID,
            transportId: transport.id,
            kind,
            rtpParameters,
          })
            .then(({ id }) => callback({ id }))
            .catch(errback);
        });
      }

      return transport;
    };

    const addRemoteTrack = ({ socketId, userId, kind, track }) => {
      if (!socketId || socketId === socket.id || userId === CLIENT_ID) return;

      const stream = remoteStreamsRef.current.get(socketId) || new MediaStream();

      stream.addTrack(track);
      remoteStreamsRef.current.set(socketId, stream);

      setParticipants((currentParticipants) => {
        const existingParticipant = currentParticipants.find(
          (participant) => participant.socketId === socketId,
        );

        return upsertParticipant(currentParticipants, {
          ...(existingParticipant ||
            createRemoteParticipant({ socketId, userId })),
          stream,
          [kind === "audio" ? "mic" : "cam"]: true,
        });
      });
    };

    const consumeProducer = async (producer) => {
      const { producerId, socketId, userId } = producer;

      if (consumedProducerIdsRef.current.has(producerId)) return;

      if (!recvTransportRef.current || !deviceRef.current || cancelled) {
        pendingProducersRef.current.push(producer);
        return;
      }

      consumedProducerIdsRef.current.add(producerId);

      try {
        const consumerOptions = await emitWithAck("consume", {
          roomId: ROOM_ID,
          transportId: recvTransportRef.current.id,
          rtpCapabilities: deviceRef.current.rtpCapabilities,
          producerId,
        });

        const consumer = await recvTransportRef.current.consume({
          id: consumerOptions.id,
          producerId: consumerOptions.producerId,
          kind: consumerOptions.kind,
          rtpParameters: consumerOptions.rtpParameters,
        });

        addRemoteTrack({
          socketId,
          userId,
          kind: consumer.kind,
          track: consumer.track,
        });

        await emitWithAck("consumer-resume", { consumerId: consumer.id });
      } catch (error) {
        consumedProducerIdsRef.current.delete(producerId);
        console.error("Could not consume remote media.", error);
      }
    };

    const consumePendingProducers = async () => {
      const producers = pendingProducersRef.current;
      pendingProducersRef.current = [];

      for (const producer of producers) {
        await consumeProducer(producer);
      }
    };

    const startCall = async () => {
      try {
        if (socket.connected) {
          socket.disconnect();
        }

        socket.connect();

        const joinedRoomPromise = new Promise((resolve) => {
          socket.once("joined-room", resolve);
        });
        const routerCapabilitiesPromise = new Promise((resolve) => {
          socket.once("router-rtp-capabilities", resolve);
        });

        socket.emit("join-room", {
          roomId: ROOM_ID,
          userId: CLIENT_ID,
        });

        const joinedRoom = await joinedRoomPromise;

        if (cancelled) return;

        const { rtpCapabilities } = await routerCapabilitiesPromise;

        if (cancelled) return;

        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });
        deviceRef.current = device;

        setParticipants((currentParticipants) => {
          const remoteParticipants = (joinedRoom.peers || [])
            .filter(
              (peer) =>
                peer?.socketId &&
                peer.socketId !== socket.id &&
                peer.userId !== CLIENT_ID,
            )
            .map((peer) => createRemoteParticipant(peer))
            .filter(Boolean);

          return getUniqueParticipants([
            currentParticipants.find((participant) => participant.isLocal) ||
              currentParticipants[0],
            ...remoteParticipants,
          ]);
        });

        recvTransportRef.current = await createTransport(device, "recv");

        await consumePendingProducers();

        sendTransportRef.current = await createTransport(device, "send");

        for (const track of localStream.getTracks()) {
          await sendTransportRef.current.produce({
            track,
            ...(track.kind === "video"
              ? {
                  encodings: [{ maxBitrate: 700000 }],
                  codecOptions: { videoGoogleStartBitrate: 600 },
                }
              : {}),
          });
        }

        socket.emit("participant-media-state", {
          roomId: ROOM_ID,
          mic: mediaStateRef.current.mic,
          cam: mediaStateRef.current.cam,
        });

        for (const producer of joinedRoom.producers || []) {
          await consumeProducer(producer);
        }
      } catch (error) {
        console.error("Could not join the media room.", error);
      }
    };

    const handleUserJoined = ({ socketId, userId, mic, cam }) => {
      if (!socketId || socketId === socket.id || userId === CLIENT_ID) return;

      setParticipants((currentParticipants) =>
        upsertParticipant(
          currentParticipants,
          createRemoteParticipant({ socketId, userId, mic, cam }),
        ),
      );
    };

    const handleUserLeft = ({ socketId }) => {
      const stream = remoteStreamsRef.current.get(socketId);
      stopStreamTracks(stream);
      remoteStreamsRef.current.delete(socketId);
      setParticipants((currentParticipants) =>
        currentParticipants.filter(
          (participant) => participant.socketId !== socketId,
        ),
      );
    };

    const handleMediaState = ({ socketId, mic, cam }) => {
      if (!socketId || socketId === socket.id) return;

      setParticipants((currentParticipants) =>
        currentParticipants.map((participant) =>
          participant.socketId === socketId
            ? { ...participant, mic, cam }
            : participant,
        ),
      );
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("participant-media-state", handleMediaState);
    socket.on("new-producer", consumeProducer);

    startCall();

    return () => {
      cancelled = true;
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("participant-media-state", handleMediaState);
      socket.off("new-producer", consumeProducer);
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      sendTransportRef.current = null;
      recvTransportRef.current = null;
      setupStartedRef.current = false;
      pendingProducersRef.current = [];
      consumedProducerIds.clear();
      socket.disconnect();
    };
  }, [localStream]);

  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [localStream]);

  const openSidebar = (tab) => {
    setSidebarTab((currentTab) => (currentTab === tab ? null : tab));

    if (tab === "chat") {
      setChatBadge(0);
    }
  };

  const changeSidebarTab = (tab) => {
    setSidebarTab(tab);

    if (tab === "chat") {
      setChatBadge(0);
    }
  };

  const sendMessage = () => {
    const text = draft.trim();

    if (!text) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        author: "You",
        text,
        mine: true,
      },
    ]);
    setDraft("");

    if (sidebarTab !== "chat") {
      setChatBadge((currentBadge) => currentBadge + 1);
    }
  };

  const focusParticipant = (participantId) => {
    if (visibleParticipants.length < 2) return;

    setFocusedId(participantId);
    setLayout("spotlight");
  };

  const selectLayout = (nextLayout) => {
    if (nextLayout === "spotlight" && visibleParticipants.length > 1) {
      setFocusedId(
        (currentFocusedId) => currentFocusedId || visibleParticipants[0].id,
      );
      setLayout("spotlight");
      return;
    }

    setFocusedId(null);
    setLayout("grid");
  };

  const toggleLayout = () => {
    if (layout === "spotlight") {
      selectLayout("grid");
      return;
    }

    selectLayout("spotlight");
  };

  const handleLeave = async () => {
    const shouldLeave = window.confirm("Leave the call?");

    if (!shouldLeave) return;

    if (socket.connected) {
      try {
        await emitWithAck("leave-room", { roomId: ROOM_ID });
      } catch (error) {
        console.error("Could not notify the room before leaving.", error);
      }
    }

    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    sendTransportRef.current = null;
    recvTransportRef.current = null;
    deviceRef.current = null;
    setupStartedRef.current = false;
    pendingProducersRef.current = [];
    consumedProducerIdsRef.current.clear();

    remoteStreamsRef.current.forEach((stream) => {
      stopStreamTracks(stream);
    });
    remoteStreamsRef.current.clear();

    setParticipants([createLocalParticipant(localStream)]);
    setFocusedId(null);
    setLayout("grid");
    setSidebarTab(null);
    setShareOn(false);
    setHandOn(false);

    socket.disconnect();
  };

  const handleInvite = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
    } finally {
      setInviteCopied(true);

      if (inviteResetRef.current) {
        window.clearTimeout(inviteResetRef.current);
      }

      inviteResetRef.current = window.setTimeout(() => {
        setInviteCopied(false);
      }, 1600);
    }
  };

  const handleCopyJoinCode = async () => {
    try {
      await navigator.clipboard?.writeText(ROOM_ID);
    } finally {
      setJoinCodeCopied(true);

      if (joinCodeResetRef.current) {
        window.clearTimeout(joinCodeResetRef.current);
      }

      joinCodeResetRef.current = window.setTimeout(() => {
        setJoinCodeCopied(false);
      }, 1600);
    }
  };

  const visibleParticipants = getUniqueParticipants(participants);

  const activeLayout =
    layout === "spotlight" && visibleParticipants.length > 1 ? "spotlight" : "grid";
  const activeFocusedId =
    activeLayout === "spotlight" &&
    visibleParticipants.some((participant) => isSameParticipant(participant, focusedId))
      ? focusedId
      : visibleParticipants[0]?.id ?? null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#07111f] font-sans text-slate-200">
      <RoomHeader
        room={ROOM_DETAILS}
        participantsCount={visibleParticipants.length}
        inviteCopied={inviteCopied}
        onInvite={handleInvite}
        onOpenParticipants={() => openSidebar("participants")}
      />

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <VideoStage
          participants={visibleParticipants}
          layout={activeLayout}
          focusedId={activeFocusedId}
          micOn={micOn}
          camOn={camOn}
          onFocusParticipant={focusParticipant}
          onCloseSpotlight={() => selectLayout("grid")}
        />

        <RoomSidebar
          activeTab={sidebarTab}
          participants={visibleParticipants}
          micOn={micOn}
          camOn={camOn}
          onToggleMic={() => setMicOn((currentValue) => !currentValue)}
          onToggleCamera={() => setCamOn((currentValue) => !currentValue)}
          messages={messages}
          draft={draft}
          onDraftChange={setDraft}
          onSendMessage={sendMessage}
          onChangeTab={changeSidebarTab}
          onClose={() => setSidebarTab(null)}
          messagesEndRef={messagesEndRef}
        />
      </main>

      <RoomFooter
        joinCode={ROOM_ID}
        joinCodeCopied={joinCodeCopied}
        micOn={micOn}
        camOn={camOn}
        shareOn={shareOn}
        handOn={handOn}
        layout={activeLayout}
        sidebarTab={sidebarTab}
        chatBadge={chatBadge}
        onToggleMic={() => setMicOn((currentValue) => !currentValue)}
        onToggleCamera={() => setCamOn((currentValue) => !currentValue)}
        onToggleShare={() => setShareOn((currentValue) => !currentValue)}
        onToggleHand={() => setHandOn((currentValue) => !currentValue)}
        onToggleLayout={toggleLayout}
        onCopyJoinCode={handleCopyJoinCode}
        onOpenSidebar={openSidebar}
        onLeave={handleLeave}
        onOpenSettings={() => openSidebar("settings")}
      />
    </div>
  );
}
