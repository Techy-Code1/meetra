import { LuX as X } from "react-icons/lu";

import ChatPanel from "./ChatPanel";
import ParticipantsPanel from "./ParticipantsPanel";
import SettingsPanel from "./SettingsPanel";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "participants", label: "Participants" },
  { id: "settings", label: "Settings" },
];

export default function RoomSidebar({
  activeTab,
  participants,
  micOn,
  camOn,
  onToggleMic,
  onToggleCamera,
  messages,
  draft,
  onDraftChange,
  onSendMessage,
  onChangeTab,
  onClose,
  messagesEndRef,
}) {
  const titleMap = {
    chat: "Chat",
    participants: `Participants (${participants.length})`,
    settings: "Settings",
  };
  const title = titleMap[activeTab] || "";

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden border-l border-[#1e3250] bg-[#0d1b2e] transition-all duration-200 ${
        activeTab ? "w-72 sm:w-80" : "w-0 border-l-0"
      }`}
      aria-hidden={!activeTab}
    >
      {activeTab && (
        <>
          <div className="flex shrink-0 items-center justify-between border-b border-[#1e3250] px-4 py-3.5">
            <h2 className="text-sm font-medium text-slate-100">{title}</h2>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="flex border-0 bg-transparent text-slate-500 transition-colors hover:text-slate-200"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex shrink-0 border-b border-[#1e3250]">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex-1 border-0 border-b-2 bg-transparent py-2.5 text-xs capitalize transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "chat" && (
            <ChatPanel
              messages={messages}
              draft={draft}
              onDraftChange={onDraftChange}
              onSendMessage={onSendMessage}
              messagesEndRef={messagesEndRef}
            />
          )}

          {activeTab === "participants" && (
            <ParticipantsPanel
              participants={participants}
              micOn={micOn}
              camOn={camOn}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPanel
              micOn={micOn}
              camOn={camOn}
              onToggleMic={onToggleMic}
              onToggleCamera={onToggleCamera}
            />
          )}
        </>
      )}
    </aside>
  );
}
