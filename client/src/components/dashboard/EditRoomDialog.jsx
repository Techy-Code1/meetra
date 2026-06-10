import React, { useState, useEffect } from "react";

function EditRoomDialog({ isOpen, onClose, onEditRoom, initialData }) {
  const [roomName, setRoomName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("bg-[#5D59C7]");

  useEffect(() => {
    if (initialData && isOpen) {
      setRoomName(initialData.title || "");
      if (initialData.themeColor) {
        // extract background color from something like "bg-[#5D59C7]/20 text-[#5D59C7]"
        const match = initialData.themeColor.match(/bg-\[[^\]]+\]/);
        if (match) {
          setSelectedTheme(match[0]);
        }
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const themes = [
    { name: "Purple", color: "bg-[#5D59C7]" },
    { name: "Green", color: "bg-[#10B981]" },
    { name: "Rose", color: "bg-[#F43F5E]" },
    { name: "Amber", color: "bg-[#F59E0B]" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomName.trim()) {
      onEditRoom({ id: initialData.id, name: roomName, theme: selectedTheme });
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
            Edit Room.
          </h2>
          <p className="font-body text-base text-[#94a3b8] leading-[24px]">
            Update your room details
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
            <label htmlFor="roomName" className="font-body text-sm font-medium text-text-secondary uppercase tracking-wider">
              Room Name
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Design Team"
              className="w-full bg-bg-canvas border border-border-subtle rounded-[8px] p-3 text-text-primary font-body focus:outline-none focus:border-border-brand transition-colors"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-medium text-text-secondary uppercase tracking-wider">
              Theme Color
            </label>
            <div className="flex gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setSelectedTheme(theme.color)}
                  className={"size-10 rounded-full " + theme.color + " flex items-center justify-center transition-transform hover:scale-110 " + (selectedTheme === theme.color ? "ring-2 ring-white ring-offset-2 ring-offset-bg-surface" : "")}
                >
                  {selectedTheme === theme.color && (
                    <svg className="size-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={!roomName.trim()}
            className="w-full mt-4 py-4 bg-bg-brand text-text-on-brand font-body font-bold rounded-[12px] hover:bg-bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditRoomDialog;