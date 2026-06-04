export default function ControlButton({
  label,
  children,
  danger = false,
  active = false,
  disabled = false,
  onClick,
  badge = false,
  wide = false,
}) {
  const toneClass = danger
    ? "bg-red-600 text-white hover:bg-red-700"
    : active
      ? "bg-[#1e3a5f] text-blue-300 hover:bg-blue-900"
      : "bg-[#162338] text-slate-200 hover:bg-[#1e3250]";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative flex h-10 ${wide ? "w-12" : "w-10"} items-center justify-center rounded-xl border-0 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {children}
      {badge && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
      )}
    </button>
  );
}
