function TopBar({ userName, meetingCount }) {
  return (
    <header className="flex items-center justify-between p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Welcome Back, {userName}
        </h1>
        <div className="flex gap-1 text-sm font-body">
          <span className="text-text-secondary">You have</span>
          <span className="font-bold text-text-primary">{meetingCount} meetings</span>
          <span className="text-text-secondary">Remaining today</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex h-10 w-[390px] items-center gap-3 rounded-[12px] bg-bg-elevated px-4">
          <svg className="size-4 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search meetings, contacts"
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary font-body"
          />
          <div className="hidden items-center justify-center rounded-[4px] bg-overlay-default px-1.5 py-0.5 sm:flex">
            <span className="text-[12px] font-medium text-text-secondary font-body">⌘+K</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
