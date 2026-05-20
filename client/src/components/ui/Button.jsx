function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "border-bg-brand bg-bg-brand text-text-inverse hover:bg-bg-brand-hover active:bg-bg-brand-pressed",
    secondary:
      "border-border-subtle bg-bg-surface text-text-primary hover:bg-bg-subtle",
    ghost:
      "border-transparent bg-transparent text-text-brand hover:bg-bg-subtle",
  };

  return (
    <button
      type={type}
      className={`inline-flex h-[42px] items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-48 font-body ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
