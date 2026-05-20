import { useEffect, useRef, useState } from "react";

import RoomFooter from "./components/RoomFooter";
import RoomHeader from "./components/RoomHeader";
import RoomSidebar from "./components/RoomSidebar";
import VideoStage from "./components/VideoStage";
import {
  INITIAL_MESSAGES,
  PARTICIPANTS,
  ROOM_DETAILS,
} from "./data/roomMockData";

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
  const messagesEndRef = useRef(null);
  const inviteResetRef = useRef(null);

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
    };
  }, []);

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
    if (PARTICIPANTS.length < 2) return;

    setFocusedId(participantId);
    setLayout("spotlight");
  };

  const toggleLayout = () => {
    if (layout === "grid" && PARTICIPANTS.length > 1) {
      setFocusedId(PARTICIPANTS[0].id);
      setLayout("spotlight");
      return;
    }

    setLayout("grid");
  };

  const handleLeave = () => {
    window.confirm("Leave the call?");
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#07111f] font-sans text-slate-200">
      <RoomHeader
        room={ROOM_DETAILS}
        participantsCount={PARTICIPANTS.length}
        inviteCopied={inviteCopied}
        onInvite={handleInvite}
        onOpenParticipants={() => openSidebar("participants")}
      />

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <VideoStage
          participants={PARTICIPANTS}
          layout={layout}
          focusedId={focusedId}
          micOn={micOn}
          camOn={camOn}
          onFocusParticipant={focusParticipant}
          onCloseSpotlight={() => setLayout("grid")}
        />

        <RoomSidebar
          activeTab={sidebarTab}
          participants={PARTICIPANTS}
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
        participantsCount={PARTICIPANTS.length}
        micOn={micOn}
        camOn={camOn}
        shareOn={shareOn}
        handOn={handOn}
        layout={layout}
        sidebarTab={sidebarTab}
        chatBadge={chatBadge}
        onToggleMic={() => setMicOn((currentValue) => !currentValue)}
        onToggleCamera={() => setCamOn((currentValue) => !currentValue)}
        onToggleShare={() => setShareOn((currentValue) => !currentValue)}
        onToggleHand={() => setHandOn((currentValue) => !currentValue)}
        onToggleLayout={toggleLayout}
        onOpenSidebar={openSidebar}
        onLeave={handleLeave}
        onOpenSettings={() => openSidebar("settings")}
      />
    </div>
  );
}
