function TextInput({
  error,
  label,
  id,
  className = "",
  wrapperClassName = "",
  ...props
}) {
  return (
    <div className={wrapperClassName}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-semibold leading-7 text-text-primary font-label"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={`h-[52px] w-full rounded-[12px] border bg-bg-surface px-4 text-base text-text-primary placeholder:text-text-subtle outline-none transition-colors duration-fast focus:ring-1 focus:ring-brand-500/20 font-body ${
          error
            ? "border-danger-500 focus:border-danger-500"
            : "border-border-subtle focus:border-border-focus"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
}

export default TextInput;
