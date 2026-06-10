import {
  LuMaximize2 as Maximize2,
  LuMinimize2 as Minimize2,
  LuRefreshCcw as RefreshCcw,
  LuX as X,
  LuZoomIn as ZoomIn,
  LuZoomOut as ZoomOut,
} from "react-icons/lu";

import { getGridClass } from "../utils/layout";
import VideoTile from "./VideoTile";

const getParticipantIndex = (participants, id) =>
  participants.findIndex((participant) => participant.id === id);

export default function VideoStage({
  stageRef,
  participants,
  layout,
  focusedId,
  micOn,
  camOn,
  zoomLevel,
  canZoom,
  isFullscreen,
  onFocusParticipant,
  onCloseSpotlight,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleFullscreen,
}) {
  const featured =
    participants.find((participant) => participant.id === focusedId) ||
    participants[0];
  const secondary = participants.filter(
    (participant) => participant.id !== featured?.id,
  );
  const canSpotlight = participants.length > 1;
  const hasThreeParticipantGrid = layout !== "spotlight" && participants.length === 3;

  if (!participants.length) {
    return (
      <section className="flex flex-1 items-center justify-center p-4 text-slate-400">
        Waiting for participants
      </section>
    );
  }

  return (
    <section
      ref={stageRef}
      className="relative flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-2.5"
    >
      {layout === "spotlight" ? (
        <div className="flex min-h-0 flex-1 gap-2 overflow-hidden">
          {secondary.length > 0 && (
            <aside className="flex h-full w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-[#1e3250] bg-[#081932] sm:w-44 lg:w-48">
              <div className="shrink-0 border-b border-[#1e3250] px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Participants
              </div>

              <div className="room-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                {secondary.map((participant) => (
                  <VideoTile
                    key={participant.id}
                    participant={participant}
                    index={getParticipantIndex(participants, participant.id)}
                    isLocal={participant.isLocal}
                    localMicOn={micOn}
                    localCamOn={camOn}
                    variant="filmstrip"
                    onSelect={() => onFocusParticipant(participant.id)}
                  />
                ))}
              </div>
            </aside>
          )}

          <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-xl border border-[#1e3250] bg-[#07162b] p-2">
            <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-lg border border-[#1e3250] bg-[#091426cc] p-1 text-slate-300 backdrop-blur-sm">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={onZoomOut}
                disabled={!canZoom || zoomLevel <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent transition-colors hover:bg-[#1e3250] hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomOut size={14} />
              </button>

              <span className="min-w-12 px-1 text-center text-[11px] font-medium text-slate-400">
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                type="button"
                aria-label="Zoom in"
                onClick={onZoomIn}
                disabled={!canZoom || zoomLevel >= 1.75}
                className="flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent transition-colors hover:bg-[#1e3250] hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomIn size={14} />
              </button>

              <button
                type="button"
                aria-label="Reset zoom"
                onClick={onResetZoom}
                disabled={!canZoom || zoomLevel === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent transition-colors hover:bg-[#1e3250] hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCcw size={13} />
              </button>

              <button
                type="button"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                onClick={onToggleFullscreen}
                className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent transition-colors hover:bg-[#1e3250] hover:text-slate-100"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>

            <button
              type="button"
              aria-label="Close spotlight"
              onClick={onCloseSpotlight}
              className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-[#091426cc] text-slate-400 transition-colors hover:bg-[#1e3250] hover:text-slate-100"
            >
              <X size={15} />
            </button>

            <VideoTile
              participant={featured}
              index={getParticipantIndex(participants, featured.id)}
              isLocal={featured.isLocal}
              localMicOn={micOn}
              localCamOn={camOn}
              variant="featured"
              zoomLevel={zoomLevel}
            />
          </div>
        </div>
      ) : hasThreeParticipantGrid ? (
        <div className="min-h-0 flex-1 overflow-hidden p-0.5">
          <div className="grid h-full w-full grid-cols-3 gap-2">
            {participants.map((participant, index) => (
              <VideoTile
                key={participant.id}
                participant={participant}
                index={index}
                isLocal={participant.isLocal}
                localMicOn={micOn}
                localCamOn={camOn}
                variant="grid"
                onSelect={
                  canSpotlight
                    ? () => onFocusParticipant(participant.id)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden p-0.5">
          <div
            className={`grid h-full w-full gap-2 ${getGridClass(participants.length)}`}
          >
            {participants.map((participant, index) => (
              <VideoTile
                key={participant.id}
                participant={participant}
                index={index}
                isLocal={participant.isLocal}
                localMicOn={micOn}
                localCamOn={camOn}
                variant="grid"
                onSelect={
                  canSpotlight
                    ? () => onFocusParticipant(participant.id)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
