import { Link, useLocation } from "react-router-dom";
import BrandMark from "../ui/BrandMark";

const MENU_ITEMS = [
  { id: "dashboard", label: "Workspaces", icon: "dashboard", to: "/dashboard" },
  { id: "meetings", label: "Meetings", icon: "video", to: "/dashboard" },
  { id: "activity", label: "Activity", icon: "activity", to: "/dashboard" },
  { id: "profile", label: "Profile", icon: "settings", to: "/profile" },
];

const FALLBACK_AVATAR =
  "https://www.figma.com/api/mcp/asset/b952d36a-b614-42d4-982d-ee30c8438491";

function Sidebar({ user, activeItem }) {
  const location = useLocation();
  const userName = user?.first_name || "User";
  const avatarUrl = user?.profile_picture_url || FALLBACK_AVATAR;

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
        {MENU_ITEMS.map((item) => {
          const isActive =
            activeItem === item.id || (!activeItem && location.pathname === item.to);

          return (
            <Link
              key={item.id}
              to={item.to}
              className={`flex items-center gap-4 rounded-[12px] px-4 py-3 transition-colors ${
                isActive
                  ? "bg-bg-elevated text-text-brand"
                  : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
              }`}
            >
              <div className="size-6 shrink-0">
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
              <span className="font-body text-base font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-2 pt-4">
        <Link
          to="/profile"
          className="flex cursor-pointer items-center gap-3 rounded-[12px] p-2 transition-colors hover:bg-bg-subtle"
        >
          <div className="size-10 overflow-hidden rounded-full bg-bg-subtle">
            <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
          </div>
          <span className="font-body text-base font-medium text-text-primary">
            {userName}
          </span>
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;
