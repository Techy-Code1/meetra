function SummaryItem({ label, value }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-border-subtle py-3 last:border-b-0">
      <span className="font-body text-sm text-text-secondary">{label}</span>
      <strong className="break-words text-right font-body text-sm font-semibold text-text-primary">
        {value || "Not provided"}
      </strong>
    </li>
  );
}

function AccountSummary({ user }) {
  const joinedAt = user?.created_at
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(user.created_at))
    : "";

  return (
    <aside className="rounded-[12px] border border-border-subtle bg-bg-surface p-5 shadow-sm">
      <h2 className="font-display text-base font-bold text-text-primary">
        Account overview
      </h2>
      <ul className="mt-3">
        <SummaryItem label="Status" value={user?.is_active ? "Active" : "Inactive"} />
        <SummaryItem
          label="Email"
          value={user?.is_verified ? "Verified" : "Not verified"}
        />
        <SummaryItem label="Member since" value={joinedAt} />
      </ul>
    </aside>
  );
}

export default AccountSummary;
