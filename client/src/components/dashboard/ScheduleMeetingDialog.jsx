import React, { useState } from "react";

function ScheduleMeetingDialog({ isOpen, onClose, onSchedule }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && scheduledAt) {
      onSchedule({
        meeting_title: title,
        description,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: parseInt(duration, 10),
      });
      setTitle("");
      setDescription("");
      setScheduledAt("");
      setDuration(60);
      onClose();
    }
  };

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
            Schedule.
          </h2>
          <p className="font-body text-base text-[#94a3b8] leading-[24px]">
            Plan a future meeting and invite your team
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-medium text-text-secondary uppercase tracking-wider">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Sync"
              className="w-full bg-bg-canvas border border-border-subtle rounded-[8px] p-3 text-text-primary font-body focus:outline-none focus:border-border-brand transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-medium text-text-secondary uppercase tracking-wider">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-bg-canvas border border-border-subtle rounded-[8px] p-3 text-text-primary font-body focus:outline-none focus:border-border-brand transition-colors [color-scheme:dark]"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-medium text-text-secondary uppercase tracking-wider">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-bg-canvas border border-border-subtle rounded-[8px] p-3 text-text-primary font-body focus:outline-none focus:border-border-brand transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-medium text-text-secondary uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this meeting about?"
              rows={3}
              className="w-full bg-bg-canvas border border-border-subtle rounded-[8px] p-3 text-text-primary font-body focus:outline-none focus:border-border-brand transition-colors resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={!title.trim() || !scheduledAt}
            className="w-full mt-4 py-4 bg-bg-brand text-text-on-brand font-body font-bold rounded-[12px] hover:bg-bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Schedule Meeting
          </button>
        </form>
      </div>
    </div>
  );
}

export default ScheduleMeetingDialog;
