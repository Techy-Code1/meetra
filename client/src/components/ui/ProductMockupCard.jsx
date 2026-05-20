import AvatarStack from "./AvatarStack.jsx";

function ProductMockupCard({ muted = false }) {
  return (
    <div
      className={`relative w-full max-w-[1024px] ${muted ? "opacity-50" : ""}`}
    >
      <div className="rounded-[24px] border border-border-subtle bg-bg-surface p-[17px] shadow-[0_25px_50px_-12px_rgba(224,231,255,0.55)]">
        <div className="aspect-[990/557] overflow-hidden rounded-[16px] border border-neutral-100 bg-neutral-50">
          <div className="flex h-full">
            <aside className="flex w-16 flex-col items-center gap-6 border-r border-border-subtle bg-bg-surface py-6">
              <span className="flex size-8 items-center justify-center rounded-md bg-brand-100 text-brand-500">
                <svg className="size-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01M12 12h.01"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="flex size-8 items-center justify-center rounded-md text-icon-secondary">
                <svg className="size-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 10.5 20 8v8l-5-2.5M4 7h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4V7Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </aside>
            <main className="flex-1 p-8">
              <div className="mb-8 flex items-start justify-between">
                <div className="h-8 w-48 rounded-md bg-neutral-200" />
                <div className="h-8 w-32 rounded-md bg-neutral-200" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-48 rounded-[12px] border border-border-subtle bg-bg-surface" />
                <div className="h-48 rounded-[12px] border border-border-subtle bg-bg-surface" />
                <div className="h-48 rounded-[12px] border border-border-subtle bg-bg-surface" />
              </div>
              <div className="mt-28 text-center text-[10px] font-bold uppercase tracking-[3px] text-text-subtle">
                Trusted by teams at
              </div>
              <div className="mx-auto mt-8 flex max-w-[720px] items-center justify-between opacity-60">
                {[96, 112, 80, 128, 96].map((width) => (
                  <div
                    key={width}
                    className="h-6 rounded bg-neutral-300"
                    style={{ width }}
                  />
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>

      <div className="absolute -left-12 bottom-[26%] w-56 rounded-[16px] border border-brand-100 bg-bg-surface p-5 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="size-2 rounded-full bg-success-500" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-700">
            Live Meeting
          </span>
        </div>
        <p className="text-sm font-semibold text-text-primary">
          Product Sync: Roadmap
        </p>
        <div className="mt-4 flex -space-x-2">
          <AvatarStack borderClass="border-bg-surface" />
        </div>
      </div>

      <div className="absolute -right-12 top-8 w-48 rounded-[16px] border border-brand-100 bg-bg-surface p-4 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">
            AL
          </span>
          <div>
            <p className="text-[10px] font-bold text-text-primary">Alex Long</p>
            <p className="text-[9px] text-text-secondary">
              Joined Design Room
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full w-2/3 rounded-full bg-brand-500" />
        </div>
      </div>
    </div>
  );
}

export default ProductMockupCard;
