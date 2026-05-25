import {
  Check,
  Copy,
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
  Video,
  VideoOff,
} from "lucide-react";

import ControlButton from "./ControlButton";

export default function RoomFooter({
  joinCode,
  joinCodeCopied,
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
  onCopyJoinCode,
  onOpenSidebar,
  onLeave,
  onOpenSettings,
}) {
  return (
    <footer className="relative flex shrink-0 items-center justify-center border-t border-[#1e3250] bg-[#0d1b2e] px-3 py-2.5 sm:px-5">
      <div className="absolute left-5 top-1/2 hidden w-220px -translate-y-1/2 items-center sm:flex">
        <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-[#1e3250] bg-[#0a1627] px-2 py-1">
          <div className="flex min-w-0 flex-1 flex-col justify-center pl-1">
            <p className="text-[9px] uppercase leading-none tracking-[0.18em] text-slate-500">
              Join code
            </p>
            <input
              type="text"
              readOnly
              value={joinCode}
              aria-label="Room join code"
              className="mt-1 w-full border-0 bg-transparent p-0 text-[15px] leading-none font-semibold text-slate-100 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onCopyJoinCode}
            aria-label="Copy room join code"
            className={`flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg border transition-colors ${
              joinCodeCopied
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-[#1e3250] bg-[#12233b] text-slate-300 hover:bg-[#1e3250] hover:text-slate-100"
            }`}
          >
            {joinCodeCopied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 overflow-x-auto sm:gap-3">
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
          label={layout === "spotlight" ? "Grid view" : "Spotlight view"}
          active={layout === "spotlight"}
          onClick={onToggleLayout}
        >
          {layout === "spotlight" ? (
            <LayoutGrid size={18} />
          ) : (
            <Spotlight size={18} />
          )}
        </ControlButton>

        <div className="mx-0.5 h-7 w-px shrink-0 bg-[#1e3250]" />

        <ControlButton label="Leave call" danger wide onClick={onLeave}>
          <PhoneOff size={18} />
        </ControlButton>
      </div>

      <div className="absolute right-3 top-1/2 flex min-w-10 -translate-y-1/2 justify-end sm:right-5 sm:min-w-150px">
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
