import {
  Hand,
  LayoutGrid,
  MessageCircle,
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Settings,
  Spotlight,
  Users,
  Video,
  VideoOff,
} from "lucide-react";

import ControlButton from "./ControlButton";

export default function RoomFooter({
  participantsCount,
  micOn,
  camOn,
  shareOn,
  handOn,
  layout,
  sidebarTab,
  chatBadge,
  onToggleMic,
  onToggleCamera,
  onToggleShare,
  onToggleHand,
  onToggleLayout,
  onOpenSidebar,
  onLeave,
  onOpenSettings,
}) {
  return (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#1e3250] bg-[#0d1b2e] px-3 py-2.5 sm:px-5">
      <div className="hidden min-w-[150px] items-center gap-2 text-xs text-slate-500 sm:flex">
        <span className="flex items-center gap-1.5 font-medium text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Connected
        </span>
        <span aria-hidden="true">{"\u00B7"}</span>
        <span>{participantsCount} participants</span>
      </div>

      <div className="flex flex-1 items-center justify-center gap-2 overflow-x-auto sm:gap-3">
        <ControlButton
          label={micOn ? "Mute microphone" : "Unmute microphone"}
          active={micOn}
          danger={!micOn}
          onClick={onToggleMic}
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </ControlButton>

        <ControlButton
          label={camOn ? "Stop video" : "Start video"}
          active={camOn}
          danger={!camOn}
          onClick={onToggleCamera}
        >
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </ControlButton>

        <div className="mx-0.5 h-7 w-px shrink-0 bg-[#1e3250]" />

        <ControlButton
          label="Open chat"
          active={sidebarTab === "chat"}
          badge={chatBadge > 0}
          onClick={() => onOpenSidebar("chat")}
        >
          <MessageCircle size={18} />
        </ControlButton>

        <ControlButton
          label={shareOn ? "Stop sharing screen" : "Share screen"}
          active={shareOn}
          onClick={onToggleShare}
        >
          {shareOn ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
        </ControlButton>

        <ControlButton
          label={handOn ? "Lower hand" : "Raise hand"}
          active={handOn}
          onClick={onToggleHand}
        >
          <span className={handOn ? "text-yellow-300" : ""}>
            <Hand size={18} />
          </span>
        </ControlButton>

        <div className="mx-0.5 h-7 w-px shrink-0 bg-[#1e3250]" />

        <ControlButton
          label={layout === "grid" ? "Spotlight view" : "Grid view"}
          active={layout === "spotlight"}
          onClick={onToggleLayout}
        >
          {layout === "grid" ? (
            <Spotlight size={18} />
          ) : (
            <LayoutGrid size={18} />
          )}
        </ControlButton>

        <ControlButton
          label="Show participants"
          active={sidebarTab === "participants"}
          onClick={() => onOpenSidebar("participants")}
        >
          <Users size={18} />
        </ControlButton>

        <div className="mx-0.5 h-7 w-px shrink-0 bg-[#1e3250]" />

        <ControlButton label="Leave call" danger wide onClick={onLeave}>
          <PhoneOff size={18} />
        </ControlButton>
      </div>

      <div className="flex min-w-10 justify-end sm:min-w-[150px]">
        <button
          type="button"
          aria-label="Open settings"
          onClick={onOpenSettings}
          className={`flex h-10 w-10 items-center justify-center gap-2 rounded-lg border border-[#1e3250] text-xs transition-colors hover:bg-[#1e3250] hover:text-slate-100 sm:w-auto sm:px-3 ${
            sidebarTab === "settings"
              ? "bg-[#1e3a5f] text-blue-300"
              : "bg-transparent text-slate-400"
          }`}
        >
          <Settings size={16} />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </footer>
  );
}
