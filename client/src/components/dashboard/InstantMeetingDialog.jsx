import React, { useState, useEffect } from "react";
import { createMeeting, joinMeeting } from "../../lib/api";

function InstantMeetingDialog({ isOpen, onClose, onStartMeeting }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState("select"); // "select", "host", "join"
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(false);
      setIsJoining(false);
      setMeetingDetails(null);
      setJoinCode("");
      setMode("select");
      setError(null);

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        setJoinCode(code);
        setMode("join");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateMeeting = async () => {
    setIsGenerating(true);
    try {
      const response = await createMeeting({ meeting_title: "Instant Meeting" });
      setMeetingDetails(response.data);
      setMode("host");
    } catch (err) {
      console.error("Failed to create meeting", err);
      setError("Failed to create meeting");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJoinMeeting = async () => {
    setIsJoining(true);
    setError(null);
    try {
      const response = await joinMeeting({ meeting_code: joinCode });
      onStartMeeting(response.data);
    } catch (err) {
      console.error("Failed to join meeting", err);
      setError("Invalid meeting code or meeting not found");
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const CopyIcon = () => (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M16 5h2a2 2 0 012 2v12a2 2 0 01-2 2h-2m-4-6l4-4m0 0l-4-4m4 4H4" /></svg>
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[480px] bg-bg-surface border border-border-subtle rounded-[12px] p-6 shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2 mb-8 relative">
          <h2 className="font-display text-[40px] font-bold text-text-primary leading-[48px] tracking-[-2px]">
            {mode === "host" ? "Invite member" : mode === "join" ? "Join Meeting" : "Instant Meeting."}
          </h2>
          <p className="font-body text-base text-[#94a3b8] leading-[24px]">
            {mode === "host" ? "Send an invitation to join the team." : 
             mode === "join" ? "Enter your meeting code to join" : 
             "Start or join a live session in just one click"}
          </p>
          <button 
            onClick={onClose}
            className="absolute right-0 top-0 p-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="size-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M24 8L8 24M8 8l16 16" />
            </svg>
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {mode === "select" && (
          <div className="flex flex-col gap-6">
            <button 
              onClick={handleCreateMeeting}
              disabled={isGenerating}
              className="w-full flex items-center gap-4 p-4 border border-border-brand rounded-[12px] bg-bg-surface hover:bg-bg-brand-subtle/10 transition-colors text-left group"
            >
              <div className="size-8 flex items-center justify-center text-text-brand">
                <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-full">
                  <rect x="2" y="4" width="28" height="20" rx="2" />
                  <path d="M12 24v4M20 24v4M8 28h16" />
                  <path d="M14 10l6 4-6 4z" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-body text-base font-semibold text-text-primary leading-[24px]">
                  {isGenerating ? "Creating..." : "Host Meeting"}
                </h3>
                <p className="font-body text-sm text-text-secondary leading-[20px]">Create a new meeting and invite participants</p>
              </div>
            </button>

            <div className="flex items-center gap-6">
              <div className="flex-1 h-px bg-border-subtle"></div>
              <span className="font-body text-sm text-text-secondary">OR</span>
              <div className="flex-1 h-px bg-border-subtle"></div>
            </div>

            <button 
              onClick={() => setMode("join")}
              className="w-full flex items-center gap-4 p-4 border border-border-subtle rounded-[12px] bg-bg-surface hover:bg-bg-surface-hover transition-colors text-left group"
            >
              <div className="size-8 flex items-center justify-center text-text-secondary">
                <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-full">
                  <rect x="4" y="6" width="24" height="20" rx="2" />
                  <path d="M12 11h8M12 15h8M12 19h4" />
                  <circle cx="23" cy="18" r="3" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-body text-base font-semibold text-text-primary leading-[24px]">Join Meeting</h3>
                <p className="font-body text-sm text-text-secondary leading-[20px]">Enter a code to join an existing session</p>
              </div>
            </button>
          </div>
        )}

        {mode === "host" && meetingDetails && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary uppercase">Meeting Code</label>
              <div className="flex items-center gap-2 p-3 bg-bg-canvas border border-border-subtle rounded-[8px]">
                <span className="font-mono text-lg font-semibold text-text-primary flex-1">
                  {meetingDetails.meeting_code}
                </span>
                <button onClick={() => copyToClipboard(meetingDetails.meeting_code)} className="p-1 text-text-secondary hover:text-text-brand">
                  <CopyIcon />
                </button>
              </div>
            </div>
            <button 
              onClick={() => onStartMeeting(meetingDetails)}
              className="w-full py-4 bg-white text-black font-bold rounded-[12px] hover:bg-gray-200 transition-colors"
            >
              Start Meeting →
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="flex flex-col gap-6">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter meeting code"
              className="w-full p-4 bg-bg-canvas border border-border-subtle rounded-[12px] text-text-primary focus:outline-none focus:border-border-brand"
            />
            <button 
              onClick={handleJoinMeeting}
              disabled={isJoining}
              className="w-full py-4 bg-white text-black font-bold rounded-[12px] hover:bg-gray-200 transition-colors"
            >
              {isJoining ? "Joining..." : "Join"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstantMeetingDialog;
