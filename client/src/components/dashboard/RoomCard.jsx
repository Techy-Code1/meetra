import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

function RoomCard({ id, title, memberCount, themeColor, members, onEdit, onDelete }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      className="flex flex-col gap-6 rounded-[12px] border border-border-subtle bg-bg-surface p-6 transition-all hover:border-border-focus hover:shadow-sm cursor-pointer relative"
      onClick={(e) => {
        if (!menuRef.current?.contains(e.target)) {
          navigate(`/lobby/${id}`);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className={`flex size-10 items-center justify-center rounded-[12px] ${themeColor}`}>
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
          </svg>
        </div>
        <div className="flex -space-x-2">
          {members.map((member, i) => (
            <div key={i} className="size-6 rounded-full border-2 border-bg-surface bg-bg-brand-subtle overflow-hidden">
              <img src={member} alt={`Member ${i}`} className="size-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-text-primary">{title}</h3>
          <div className="relative" ref={menuRef}>
            <button 
              className="text-text-secondary hover:text-text-primary p-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 rounded-md border border-border-subtle bg-bg-surface shadow-lg z-10 py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-subtle transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit && onEdit(); }}
                >
                  Edit
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-danger-500 hover:bg-danger-500/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete && onDelete(); }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="font-body text-sm text-text-secondary">{memberCount} members</p>
      </div>
    </div>
  );
}

export default RoomCard;
