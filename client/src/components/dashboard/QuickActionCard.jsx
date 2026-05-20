function QuickActionCard({ title, description, icon, onClick }) {
  const getIcon = () => {
    switch (icon) {
      case 'instant':
        return (
          <svg className="size-6 text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        );
      case 'schedule':
        return (
          <svg className="size-6 text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'room':
        return (
          <svg className="size-6 text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <button 
      onClick={onClick}
      className="flex flex-1 flex-col items-start gap-6 rounded-[12px] border border-border-subtle bg-bg-surface p-6 text-left transition-all hover:border-border-focus hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex size-[42px] items-center justify-center rounded-[12px] bg-bg-brand-subtle">
        {getIcon()}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-base font-bold text-text-primary">{title}</h3>
        <p className="font-body text-[13px] text-text-secondary">{description}</p>
      </div>
    </button>
  );
}

export default QuickActionCard;
