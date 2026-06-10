import AvatarStack from "./AvatarStack.jsx";
import ProductMockupCard from "./ProductMockupCard.jsx";

function AuthAside({ showCopy = false }) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-bg-brand text-text-inverse lg:block">
      {showCopy && (
        <div className="absolute left-14.5 top-40 z-10 max-w-130">
          <h1 className="text-[48px] font-bold leading-[1.12] tracking-normal text-white font-display">
            Connect instantly!
          </h1>
          <p className="mt-6 max-w-117.5 text-sm font-bold leading-6 text-white font-body">
            Join over 10,000 teams using Meetra to streamline their workflows
            and build better products together.
          </p>
        </div>
      )}

      <div className="absolute bottom-8 left-14.5 z-10 flex items-center gap-2 text-sm text-brand-100">
        <AvatarStack />
        <span>+ 2k teams joined this week</span>
      </div>

      <div
        className={`absolute ${
          showCopy ? "left-41.25 top-70" : "left-37.5 top-68.75"
        } w-240 rotate-[-17deg]`}
      >
        <ProductMockupCard muted />
      </div>
    </aside>
  );
}

export default AuthAside;
