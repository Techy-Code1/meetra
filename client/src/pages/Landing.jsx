import { Link } from "react-router-dom";
import BrandMark from "../components/ui/BrandMark.jsx";
import ProductMockupCard from "../components/ui/ProductMockupCard.jsx";

function CheckItem({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-text-subtle">
      <svg
        className="size-5 text-success-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  );
}

function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-bg-surface text-text-primary">
      <nav className="mx-auto flex h-24 max-w-[1280px] items-center justify-between px-6 sm:px-12">
        <BrandMark />
        <div className="hidden items-center gap-8 md:flex">
          <a className="text-sm font-medium text-neutral-600" href="#features">
            Features
          </a>
          <a className="text-sm font-medium text-neutral-600" href="#pricing">
            Pricing
          </a>
          <Link className="text-sm font-medium text-text-primary" to="/sign-in">
            Sign In
          </Link>
          <Link
            className="rounded-[12px] border border-bg-brand bg-bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-bg-brand-hover"
            to="/sign-up"
          >
            Join now
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex max-w-[1280px] flex-col items-center px-6 pb-20 pt-8 text-center sm:px-12">
        <h1 className="max-w-[920px] text-[44px] font-extrabold leading-[1.1] tracking-normal text-neutral-900 font-body sm:text-[64px] lg:text-[72px]">
          Meetings that feel like{" "}
          <span className="bg-gradient-to-r from-[#4f46e5] to-[#9333ea] bg-clip-text text-transparent">
            real conversation.
          </span>
        </h1>
        <p className="mt-7 max-w-[672px] text-lg leading-8 text-text-secondary sm:text-xl">
          The modern workspace for remote teams. High-fidelity video,
          persistent project rooms, and focus-first collaboration tools built
          for the way you actually work.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            className="inline-flex h-[68px] items-center gap-3 rounded-[16px] bg-bg-brand px-10 text-lg font-bold text-text-inverse shadow-[0_20px_25px_-5px_rgba(199,210,254,1)] transition-colors hover:bg-bg-brand-hover"
            to="/sign-up"
          >
            Get Started Free
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            className="inline-flex h-[68px] items-center justify-center rounded-[16px] border border-border-subtle bg-bg-surface px-10 text-lg font-bold text-neutral-700 transition-colors hover:bg-bg-subtle"
            to="/room"
          >
            Watch Demo
          </Link>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
          <CheckItem>No credit card required</CheckItem>
          <CheckItem>Unlimited free meetings</CheckItem>
        </div>

        <div className="mt-16 w-full px-4">
          <ProductMockupCard />
        </div>
      </section>
    </main>
  );
}

export default Landing;
