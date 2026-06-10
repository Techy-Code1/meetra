function AvatarStack({ borderClass = "border-bg-brand" }) {
  return (
    <div className="flex -space-x-2">
      {[
        ["MK", "bg-[#fce7f3] text-[#db2777]"],
        ["JS", "bg-brand-100 text-brand-600"],
        ["AL", "bg-success-100 text-success-700"],
      ].map(([label, className]) => (
        <span
          key={label}
          className={`flex size-7 items-center justify-center rounded-full border-2 ${borderClass} ${className} text-[10px] font-bold`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export default AvatarStack;
