import { Link } from "react-router-dom";
import BrandMark from "../ui/BrandMark";

const MENU_ITEMS = [
  { id: "workspaces", label: "Workspaces", icon: "dashboard", active: true },
  { id: "meetings", label: "Meetings", icon: "video", active: false },
  { id: "activity", label: "Activity", icon: "activity", active: false },
  { id: "settings", label: "Settings", icon: "settings", active: false },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[300px] flex-col border-r border-border-subtle bg-bg-surface p-4 lg:flex">
      <div className="flex items-center justify-between px-2 py-4">
        <BrandMark />
        <button className="text-text-secondary hover:text-text-primary">
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      <nav className="mt-8 flex-1 space-y-2">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={`/${item.id}`}
            className={`flex items-center gap-4 rounded-[12px] px-4 py-3 transition-colors ${
              item.active
                ? "bg-bg-elevated text-text-brand"
                : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
            }`}
          >
            <div className="size-6 shrink-0">
              {/* Icon placeholder based on item.icon */}
              {item.icon === "dashboard" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              )}
              {item.icon === "video" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              )}
              {item.icon === "activity" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              )}
              {item.icon === "settings" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              )}
            </div>
            <span className="text-base font-semibold font-body">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-border-subtle p-2 pt-4">
        <div className="flex items-center gap-3 rounded-[12px] p-2 hover:bg-bg-surface-hover transition-colors cursor-pointer">
          <div className="size-10 rounded-full bg-bg-brand-subtle overflow-hidden">
            <img src="https://www.figma.com/api/mcp/asset/b952d36a-b614-42d4-982d-ee30c8438491" alt="Avatar" className="size-full object-cover" />
          </div>
          <span className="text-base font-medium text-text-primary font-body">Ezekay</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
