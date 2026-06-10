import {
  LuUserPlus as UserPlus,
  LuUsers as Users,
  LuVideo as Video,
} from "react-icons/lu";
import { IoHandRightOutline } from "react-icons/io5";

import Avatar from "./Avatar";

function HeaderButton({ children, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 items-center gap-1.5 rounded-lg border border-[#1e3250] bg-transparent px-2.5 text-xs text-slate-400 transition-colors hover:bg-[#1e3250] hover:text-slate-100"
    >
      {children}
    </button>
  );
}

export default function RoomHeader({
  room,
  participantsCount,
  raisedHandsCount = 0,
  inviteCopied,
  onInvite,
  onOpenParticipants,
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#1e3250] bg-[#0d1b2e] px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
          <Video size={19} />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-100">
            {room.title}
          </h1>
          <p className="truncate text-xs text-slate-500">{room.id}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {raisedHandsCount > 0 && (
          <div className="hidden items-center gap-2 rounded-full bg-[#86e37d] px-3 py-1.5 text-xs font-medium text-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.12)] sm:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-slate-950">
              <IoHandRightOutline size={18} />
            </span>
            <span className="whitespace-nowrap">
              {raisedHandsCount} hand{raisedHandsCount === 1 ? "" : "s"} raised
            </span>
          </div>
        )}

        <HeaderButton label="Invite participants" onClick={onInvite}>
          <UserPlus size={14} />
          <span className="hidden sm:inline">
            {inviteCopied ? "Copied" : "Invite"}
          </span>
        </HeaderButton>

        <HeaderButton label="Show participants" onClick={onOpenParticipants}>
          <Users size={14} />
          <span>{participantsCount}</span>
        </HeaderButton>

        <Avatar
          initials={room.profileInitials}
          colorIndex={0}
          className="h-8 w-8 text-xs"
        />
      </div>
    </header>
  );
}
