import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resendEmailOTP, verifyEmailOTP } from "../lib/api.js";

const OTP_LENGTH = 6;
const RESEND_WAIT_SECONDS = 60;

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  const email = useMemo(() => {
    return (
      location.state?.email ||
      localStorage.getItem("pendingVerificationEmail") ||
      ""
    );
  }, [location.state?.email]);

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [errors, setErrors] = useState({});
  const [apiMessage, setApiMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_WAIT_SECONDS);

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timerId = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [resendSeconds]);

  const setCodeFromString = (value) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    const nextDigits = Array(OTP_LENGTH).fill("");

    cleanValue.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });

    setDigits(nextDigits);
    setErrors({});
    setApiError("");

    const nextIndex = Math.min(cleanValue.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleDigitChange = (index, value) => {
    if (value.length > 1) {
      setCodeFromString(value);
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    setDigits((prev) => {
      const nextDigits = [...prev];
      nextDigits[index] = value;
      return nextDigits;
    });
    setErrors({});
    setApiError("");

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    setCodeFromString(event.clipboardData.getData("text"));
  };

  const validate = () => {
    const nextErrors = {};

    if (!email) {
      nextErrors.email = "Start signup again to request a verification code.";
    }

    if (!code) {
      nextErrors.otp = "Enter the 6-digit verification code";
    } else if (!/^\d{6}$/.test(code)) {
      nextErrors.otp = "Verification code must be exactly 6 digits";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsVerifying(true);
    setApiError("");
    setApiMessage("");

    try {
      const response = await verifyEmailOTP({ email, otp: code });

      if (response.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }

      localStorage.removeItem("pendingVerificationEmail");
      navigate("/onboarding", { replace: true });
    } catch (error) {
      setApiError(error.message || "Invalid verification code. Try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendSeconds > 0) return;

    setIsResending(true);
    setApiError("");
    setApiMessage("");

    try {
      const response = await resendEmailOTP({ email });
      setDigits(Array(OTP_LENGTH).fill(""));
      setApiMessage(response.message || "A new verification code was sent.");
      setResendSeconds(RESEND_WAIT_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (error) {
      setApiError(error.message || "Could not resend the code. Try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-surface px-4 py-12 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[512px] flex-col items-center justify-center gap-8">
        <header className="text-center">
          <h1 className="font-display text-[32px] font-semibold leading-[38.4px] text-text-primary">
            Check your email
          </h1>
          <p className="mt-3 font-body text-base leading-6 text-[#494551]">
            We've sent a 6-digit verification code to
            <span className="block font-semibold text-text-subtle">
              {email || "your email address"}
            </span>
          </p>
        </header>

        <section className="w-full rounded-[12px] border border-[#cbc4d2] bg-bg-surface px-6 py-10 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:px-[49px] sm:py-[52px]">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e0e0e0]">
              <svg
                aria-hidden="true"
                className="h-8 w-9 text-bg-brand"
                viewBox="0 0 34 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 6.5H23.5C25.1569 6.5 26.5 7.84315 26.5 9.5V23.5C26.5 25.1569 25.1569 26.5 23.5 26.5H3.5C1.84315 26.5 0.5 25.1569 0.5 23.5V9.5C0.5 7.84315 1.84315 6.5 3.5 6.5Z"
                  fill="currentColor"
                />
                <path
                  d="M1.5 8.5L13.5 17.5L25.5 8.5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="28.5" cy="5.5" r="4.5" fill="currentColor" />
                <circle cx="30" cy="4" r="1.5" fill="white" opacity="0.9" />
              </svg>
            </div>
          </div>

          {apiMessage && (
            <div className="mb-4 rounded-[12px] border border-success-100 bg-success-100 px-4 py-3 font-body text-sm text-success-700">
              {apiMessage}
            </div>
          )}

          {apiError && (
            <div className="mb-4 rounded-[12px] border border-danger-100 bg-danger-100 px-4 py-3 font-body text-sm text-danger-700">
              {apiError}
            </div>
          )}

          {errors.email && (
            <div className="mb-4 rounded-[12px] border border-warning-100 bg-warning-100 px-4 py-3 font-body text-sm text-warning-700">
              {errors.email}
            </div>
          )}

          <form onSubmit={handleVerify} noValidate>
            <fieldset
              className="mb-8 flex items-center justify-between gap-2 sm:gap-5"
              aria-label="Verification code"
            >
              {digits.map((digit, index) => (
                <input
                  key={`otp-${index}`}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${index + 1}`}
                  aria-invalid={Boolean(errors.otp)}
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    handleDigitChange(index, event.target.value)
                  }
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  className={`size-12 rounded-[8px] border-2 bg-[#fdf7ff] text-center font-display text-xl font-semibold text-text-primary outline-none transition-colors duration-fast focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 ${
                    errors.otp ? "border-danger-500" : "border-[#cbc4d2]"
                  }`}
                />
              ))}
            </fieldset>

            {errors.otp && (
              <p className="-mt-6 mb-6 text-center font-body text-xs text-danger-500">
                {errors.otp}
              </p>
            )}

            <button
              type="submit"
              disabled={!isComplete || isVerifying || !email}
              className="w-full rounded-full bg-bg-brand px-4 py-4 font-display text-xl font-semibold leading-7 text-text-inverse transition-colors duration-fast hover:bg-bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-48"
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </button>
          </form>

          <div className="mt-4 border-t border-[#cbc4d2] pt-4 text-center">
            <p className="font-body text-sm leading-[21px] text-[#494551]">
              Didn't receive the email?
            </p>
            <button
              type="button"
              disabled={!email || isResending || resendSeconds > 0}
              onClick={handleResend}
              className="mt-3 font-body text-sm font-semibold leading-[14px] tracking-[0.05em] text-text-brand transition-colors duration-fast hover:text-brand-700 disabled:cursor-not-allowed disabled:text-text-disabled"
            >
              {isResending
                ? "Sending..."
                : resendSeconds > 0
                  ? `Resend code in ${resendSeconds}s`
                  : "Resend code"}
            </button>
          </div>
        </section>

        <Link
          to="/sign-in"
          className="inline-flex items-center gap-2 font-body text-sm font-semibold leading-[14px] tracking-[0.05em] text-[#494551] transition-colors duration-fast hover:text-text-primary"
        >
          <svg
            aria-hidden="true"
            className="size-3"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.5 2.25L3.75 6L7.5 9.75"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 6H10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to login
        </Link>
      </div>
    </main>
  );
}

export default VerifyEmail;
