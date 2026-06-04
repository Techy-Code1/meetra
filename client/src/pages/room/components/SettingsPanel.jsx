import { useState } from "react";
import { Mic, Video } from "lucide-react";

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg bg-[#0f1f35] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1e3250] text-blue-300">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-slate-100">
          {label}
        </span>

        <span className="block truncate text-[11px] text-slate-500">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-blue-500"
      />
    </label>
  );
}

export default function SettingsPanel({
  micOn,
  camOn,
  onToggleMic,
  onToggleCamera,
}) {
  const [recordingRequested, setRecordingRequested] = useState(false);

  const handleToggleRecording = () => {
    setRecordingRequested(true);

    setTimeout(() => {
      setRecordingRequested(false);

      alert(
        "Your request to start recording has been sent to the administrator."
      );
    }, 2000);
  };

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
      <ToggleRow
        icon={<Mic size={17} />}
        label="Microphone"
        description={micOn ? "Input is active" : "Input is muted"}
        checked={micOn}
        onChange={onToggleMic}
      />

      <ToggleRow
        icon={<Video size={17} />}
        label="Camera"
        description={camOn ? "Video is active" : "Video is stopped"}
        checked={camOn}
        onChange={onToggleCamera}
      />

      {/* Request recording */}
      <div className="rounded-lg border border-[#1e3250] bg-[#081426] p-3">
        <p className="text-[13px] font-medium text-slate-100">
          Request Recording
        </p>

        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          Ask the administrator to start recording the meeting.
        </p>

        <button
          onClick={handleToggleRecording}
          disabled={recordingRequested}
          className={`mt-3 flex items-center justify-center gap-2 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold shadow-md transition-all duration-300 ease-in-out
          bg-linear-to-r from-cyan-500 to-blue-600 text-white
          hover:from-cyan-600 hover:to-blue-700 hover:scale-105
          ${
            recordingRequested
              ? "cursor-not-allowed opacity-50"
              : ""
          }`}
        >
          <Mic size={16} />

          {recordingRequested
            ? "Requesting..."
            : "Request Recording"}
        </button>
      </div>
    </div>
  );
}