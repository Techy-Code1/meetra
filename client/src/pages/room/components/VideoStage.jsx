import { X } from "lucide-react";

import { getGridClass } from "../utils/layout";
import VideoTile from "./VideoTile";

const getParticipantIndex = (participants, id) =>
  participants.findIndex((participant) => participant.id === id);

export default function VideoStage({
  participants,
  layout,
  focusedId,
  micOn,
  camOn,
  onFocusParticipant,
  onCloseSpotlight,
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
    <section className="relative flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-2.5">
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
