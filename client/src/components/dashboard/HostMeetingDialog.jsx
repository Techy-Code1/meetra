import React from 'react';

function HostMeetingDialog({ isOpen, onClose, inviteCode = "D8J7ACJX", onStartMeeting }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-[546px]">
        {/* Main Dialog */}
        <div 
          className="w-full bg-bg-surface border border-border-subtle rounded-[12px] p-8 shadow-xl relative flex flex-col items-center gap-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col gap-2 text-center w-full">
            <h2 className="font-display text-[40px] font-bold text-text-primary leading-[48px] tracking-tight">
              Invite member
            </h2>
            <p className="font-body text-base text-[#94a3b8] leading-[24px]">
              Send an invitation to join the team.
            </p>
          </div>

          {/* Invite Code Section */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-body text-sm font-bold text-[#94a3b8] uppercase tracking-[1px] leading-[20px]">
              Invite CODE
            </label>
            <div className="flex items-center justify-between px-4 py-3 bg-bg-surface border-2 border-border-focus rounded-[12px] h-[52px] group-focus-within:ring-2 ring-border-focus/20 transition-all">
              <input 
                type="text"
                readOnly
                value={inviteCode}
                className="font-body text-base font-bold text-text-primary tracking-wide bg-transparent outline-none flex-1"
              />
              <button 
                className="text-text-secondary hover:text-text-primary transition-colors p-1"
                onClick={() => navigator.clipboard.writeText(inviteCode)}
                title="Copy code"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={onStartMeeting}
            className="w-full py-3 px-4 bg-bg-brand border border-border-brand rounded-[12px] text-text-inverse font-body font-semibold text-base flex items-center justify-center gap-2 hover:bg-bg-brand-hover transition-all active:scale-[0.98] shadow-sm"
          >
            Start Meeting →
          </button>

          {/* Close button (optional, not in Figma but good for UX) */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info Banner */}
        <div 
          className="w-full bg-bg-subtle border border-border-subtle rounded-[12px] p-4 flex gap-2 items-start shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="size-4 mt-0.5 text-text-secondary">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm.75-10.25v-1h-1.5v1h1.5zM9 11V6H7v1h1v4H7v1h3v-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-body text-sm text-text-primary leading-[20px]">
            To enhance collaboration and expand your team's capabilities, please invite new members to join your group.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HostMeetingDialog;
