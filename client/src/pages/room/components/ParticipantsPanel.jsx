import { Mic, MicOff, Video, VideoOff } from "lucide-react";

import Avatar from "./Avatar";

export default function ParticipantsPanel({ participants, micOn, camOn }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">
      {participants.map((participant, index) => {
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
    </div>
  );
}
