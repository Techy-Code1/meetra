import { Mic, MicOff, VideoOff } from "lucide-react";

import Avatar from "./Avatar";

const getTileSize = (variant) => {
  if (variant === "filmstrip") return "h-8 w-8 text-xs";
  if (variant === "featured") return "h-16 w-16 text-xl";

  return "h-14 w-14 text-lg";
};

export default function VideoTile({
  participant,
  index,
  isLocal,
  localMicOn,
  localCamOn,
  variant = "grid",
  selected = false,
  onSelect,
}) {
  const micActive = isLocal ? localMicOn : participant.mic;
  const camActive = isLocal ? localCamOn : participant.cam;
  const isFilmstrip = variant === "filmstrip";
  const isFeatured = variant === "featured";

  const shapeClass = isFilmstrip
    ? "h-full min-w-[10rem] basis-[10rem] sm:min-w-[12rem] sm:basis-[12rem]"
    : isFeatured
      ? "h-full w-full"
      : "h-full w-full min-h-0";

  const borderClass = participant.talking
    ? "border-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
    : selected
      ? "border-blue-500"
      : "border-[#1e3250]";

  return (
    <article
      onClick={onSelect}
      className={`relative overflow-hidden rounded-xl border bg-[#0d1b2e] transition-all duration-150 ${shapeClass} ${borderClass} ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div
        className={`flex h-full w-full items-center justify-center ${
          isLocal
            ? "bg-[radial-gradient(ellipse_at_center,#1b1040_0%,#0d0b1e_100%)]"
            : "bg-[radial-gradient(ellipse_at_center,#1a3050_0%,#0d1b2e_100%)]"
        } ${camActive ? "" : "opacity-80"}`}
      >
        <Avatar
          initials={participant.initials}
          colorIndex={index}
          className={getTileSize(variant)}
        />
      </div>

      {isLocal && (
        <div className="absolute left-2 top-2 rounded bg-indigo-500/25 px-1.5 py-0.5 text-[10px] text-indigo-200 ring-1 ring-indigo-400/40">
          You
        </div>
      )}

      {!camActive && (
        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white">
          <VideoOff size={14} />
        </div>
      )}

      <div
        className={`absolute flex items-center gap-1 rounded-md bg-[#07111f]/80 text-slate-200 backdrop-blur-sm ${
          isFilmstrip
            ? "bottom-1 left-1 px-1.5 py-0.5 text-[9px]"
            : "bottom-2 left-2 px-2 py-1 text-[11px]"
        }`}
      >
        <span className={micActive ? "text-green-400" : "text-red-400"}>
          {micActive ? <Mic size={11} /> : <MicOff size={11} />}
        </span>
        <span className="max-w-[9rem] truncate">{participant.name}</span>
      </div>

      {!micActive && (
        <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90 text-white">
          <MicOff size={12} />
        </div>
      )}

      {isFeatured && participant.talking && (
        <div className="absolute left-2 top-2 rounded-md bg-green-500/15 px-2 py-1 text-xs font-medium text-green-300 ring-1 ring-green-400/30">
          Speaking
        </div>
      )}
    </article>
  );
}
