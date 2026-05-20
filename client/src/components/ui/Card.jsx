function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-[12px] border border-border-subtle bg-bg-surface p-4 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export default Card;
