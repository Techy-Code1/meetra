import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, verifyForgotPasswordOTP } from "../lib/api.js";
import AuthAside from "../components/ui/AuthAside.jsx";

const OTP_LENGTH = 6;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPassword() {
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const [step, setStep] = useState("email"); // 'email' or 'otp'
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiMessage, setApiMessage] = useState("");
  const [errors, setErrors] = useState({});

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;

  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  // --- Email Step Logic ---
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setErrors({});

    if (!email) {
      setErrors({ email: "Email is required." });
      return;
    }
    if (!emailPattern.test(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword({ email });
      setApiMessage(res.message || "OTP sent to your email.");
      setStep("otp");
    } catch (err) {
      setApiError(err.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP Step Logic ---
  const setCodeFromString = (value) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    const nextDigits = Array(OTP_LENGTH).fill("");
    cleanValue.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });
    setDigits(nextDigits);
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
    setApiError("");
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    setCodeFromString(event.clipboardData.getData("text"));
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    if (!isComplete) return;

    setIsLoading(true);
    setApiError("");
    try {
      const res = await verifyForgotPasswordOTP({ email, otp: code });
      // On success, backend returns { resetToken, email }
      navigate("/reset-password", { 
        state: { 
          email: res.data.email, 
          resetToken: res.data.resetToken 
        } 
      });
    } catch (err) {
      setApiError(err.message || "Invalid OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-canvas lg:grid lg:grid-cols-[minmax(420px,40vw)_1fr]">
      <AuthAside />

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[524px]">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold leading-7 text-text-primary font-display">
              {step === "email" ? "Forgot Password?" : "Check your email"}
            </h1>
            <p className="mt-1 text-base leading-7 text-text-secondary">
              {step === "email" 
                ? "No worries, we'll send you reset instructions." 
                : `We've sent a 6-digit verification code to ${email}`}
            </p>
          </div>

          <div className="rounded-[12px] border border-border-subtle bg-bg-surface p-6 shadow-sm">
            {apiError && (
              <div className="mb-4 rounded-[12px] border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-700 font-body">
                {apiError}
              </div>
            )}
            {apiMessage && step === "otp" && (
               <div className="mb-4 rounded-[12px] border border-success-100 bg-success-100 px-4 py-3 text-sm text-success-700 font-body">
                {apiMessage}
              </div>
            )}

            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} noValidate className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold leading-7 text-text-primary"
                  >
                    Email Address
                  </label>
                  <div
                    className={`flex h-[52px] items-center gap-3 rounded-[12px] border bg-bg-surface px-4 transition-colors duration-fast focus-within:ring-1 focus-within:ring-brand-500/20 ${
                      errors.email ? "border-danger-500" : "border-border-subtle focus-within:border-border-focus"
                    }`}
                  >
                    <svg
                      className="size-5 shrink-0 text-icon-secondary"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm-.4 4.25-7.07 4.42a1 1 0 0 1-1.06 0L4.4 8.25 5.46 6.55 12 10.64l6.54-4.09 1.06 1.7Z" />
                    </svg>
                    <input
                      id="email"
                      type="email"
                      placeholder="eze@meetra.so"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-subtle outline-none font-body"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-medium text-danger-700">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[12px] border border-bg-brand bg-bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors duration-fast hover:bg-bg-brand-hover active:bg-bg-brand-pressed focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-48"
                >
                  {isLoading ? "Sending..." : "Reset Password"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOTPVerify} noValidate>
                <fieldset className="mb-8 flex items-center justify-between gap-2" aria-label="Verification code">
                  {digits.map((digit, index) => (
                    <input
                      key={`otp-${index}`}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className={`size-12 rounded-[8px] border-2 bg-bg-surface text-center font-display text-xl font-semibold text-text-primary outline-none transition-colors duration-fast focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 ${
                        apiError ? "border-danger-500" : "border-border-subtle"
                      }`}
                    />
                  ))}
                </fieldset>

                <button
                  type="submit"
                  disabled={!isComplete || isLoading}
                  className="w-full rounded-[12px] bg-bg-brand px-4 py-3 text-sm font-semibold text-text-inverse transition-colors duration-fast hover:bg-bg-brand-hover disabled:opacity-48"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-sm font-semibold text-text-brand hover:text-brand-700"
                  >
                    Use a different email
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/sign-in"
                className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;
