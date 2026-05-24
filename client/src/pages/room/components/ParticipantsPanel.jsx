import { Mic, MicOff, Search, Video, VideoOff } from "lucide-react";
import { useMemo, useState } from "react";

import Avatar from "./Avatar";

export default function ParticipantsPanel({
  participants,
  micOn,
  camOn,
  className = "",
}) {
  const [query, setQuery] = useState("");

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return participants;
    }

    return participants.filter((participant) =>
      participant.name.toLowerCase().includes(normalizedQuery),
    );
  }, [participants, query]);

  return (
    <div className={`room-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto p-3 ${className}`}>
      <div className="sticky top-0 z-10 rounded-xl bg-[#0d1b2e] pb-2">
        <label className="flex items-center gap-2 rounded-xl border border-[#1e3250] bg-[#0f1f35] px-3 py-2 text-slate-400 focus-within:border-blue-500 focus-within:text-blue-300">
          <Search size={15} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search participants"
            className="w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      {filteredParticipants.map((participant, index) => {
        const micActive = participant.isLocal ? micOn : participant.mic;
        const camActive = participant.isLocal ? camOn : participant.cam;

        return (
          <div
            key={participant.id}
            className="flex items-center gap-2.5 rounded-lg bg-[#0f1f35] p-2"
          >
            <Avatar
              initials={participant.initials}
              colorIndex={index}
              className="h-9 w-9 text-xs"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-slate-100">
                {participant.name}
                {participant.isLocal ? " (Host)" : ""}
              </p>
              <p className="text-[11px] text-slate-500">
                {camActive ? "Camera on" : "Camera off"}
              </p>
            </div>

            <div className="flex gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md bg-[#1e3250] ${
                  micActive ? "text-green-400" : "text-red-400"
                }`}
              >
                {micActive ? <Mic size={12} /> : <MicOff size={12} />}
              </div>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md bg-[#1e3250] ${
                  camActive ? "text-green-400" : "text-red-400"
                }`}
              >
                {camActive ? <Video size={12} /> : <VideoOff size={12} />}
              </div>
            </div>
          </div>
        );
      })}

      {!filteredParticipants.length && (
        <div className="rounded-lg border border-dashed border-[#1e3250] bg-[#0f1f35] px-3 py-6 text-center text-sm text-slate-400">
          No participants found.
        </div>
      )}
    </div>
  );
}
