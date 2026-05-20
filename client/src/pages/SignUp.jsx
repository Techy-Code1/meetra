import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthAside from "../components/ui/AuthAside.jsx";
import GoogleIcon from "../components/ui/GoogleIcon.jsx";
import { register } from "../lib/api.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PATTERN = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;

function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
    setApiError("");
  };

  const validate = () => {
    const newErrors = {};
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const emailTrimmed = formData.email.trim();

    if (!firstName) {
      newErrors.firstName = "First name is required";
    } else if (firstName.length > 50) {
      newErrors.firstName = "First name must be 50 characters or fewer";
    } else if (!NAME_PATTERN.test(firstName)) {
      newErrors.firstName = "Use letters, apostrophes, or hyphens only";
    }

    if (!lastName) {
      newErrors.lastName = "Last name is required";
    } else if (lastName.length > 50) {
      newErrors.lastName = "Last name must be 50 characters or fewer";
    } else if (!NAME_PATTERN.test(lastName)) {
      newErrors.lastName = "Use letters, apostrophes, or hyphens only";
    }

    if (!emailTrimmed) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_PATTERN.test(emailTrimmed)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (/\s/.test(formData.password)) {
      newErrors.password = "Password cannot contain spaces";
    } else if (!PASSWORD_PATTERN.test(formData.password)) {
      newErrors.password =
        "Use 8+ characters with uppercase, lowercase, number, and symbol";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setApiError("");

    const payload = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
    };

    try {
      await register(payload);
      localStorage.setItem("pendingVerificationEmail", payload.email);
      navigate("/verify-email", {
        replace: true,
        state: { email: payload.email },
      });
    } catch (err) {
      setApiError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-surface text-text-primary lg:grid lg:grid-cols-[minmax(420px,40vw)_1fr]">
      <AuthAside showCopy />

      <main className="flex min-h-screen items-center justify-center bg-bg-surface px-5 py-10 sm:px-8">
        <div className="w-full max-w-[524px]">
          <div className="mb-6">
            <h2 className="text-xl font-semibold leading-7 text-text-primary font-display">
              Create your account
            </h2>
            <p className="mt-1 text-base leading-7 text-text-secondary font-body">
              Start your 14-day free trial. No credit card required.
            </p>
          </div>

          <div className="rounded-[12px] border border-border-subtle bg-bg-surface p-4 shadow-sm">
            {apiError && (
              <div className="mb-4 rounded-[12px] border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-700 font-body">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="space-y-4 p-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold leading-7 text-text-primary font-label">
                    Full Name
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        autoComplete="given-name"
                        aria-invalid={Boolean(errors.firstName)}
                        className={`h-[52px] w-full rounded-[12px] border bg-bg-surface px-4 text-base text-text-primary placeholder:text-neutral-400 outline-none transition-colors duration-fast focus:ring-1 focus:ring-brand-500/20 font-body ${
                          errors.firstName
                            ? "border-danger-500 focus:border-danger-500"
                            : "border-border-subtle focus:border-border-focus"
                        }`}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-xs text-danger-500">
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        autoComplete="family-name"
                        aria-invalid={Boolean(errors.lastName)}
                        className={`h-[52px] w-full rounded-[12px] border bg-bg-surface px-4 text-base text-text-primary placeholder:text-neutral-400 outline-none transition-colors duration-fast focus:ring-1 focus:ring-brand-500/20 font-body ${
                          errors.lastName
                            ? "border-danger-500 focus:border-danger-500"
                            : "border-border-subtle focus:border-border-focus"
                        }`}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-xs text-danger-500">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold leading-7 text-text-primary font-label"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="eze@meetra.so"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    className={`h-[52px] w-full rounded-[12px] border bg-bg-surface px-4 text-base text-text-primary placeholder:text-neutral-400 outline-none transition-colors duration-fast focus:ring-1 focus:ring-brand-500/20 font-body ${
                      errors.email
                        ? "border-danger-500 focus:border-danger-500"
                        : "border-border-subtle focus:border-border-focus"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-danger-500">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold leading-7 text-text-primary font-label"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.password)}
                      className={`h-[52px] w-full rounded-[12px] border bg-bg-surface px-4 pr-12 text-base text-text-primary placeholder:text-neutral-950 outline-none transition-colors duration-fast focus:ring-1 focus:ring-brand-500/20 font-body ${
                        errors.password
                          ? "border-danger-500 focus:border-danger-500"
                          : "border-border-subtle focus:border-border-focus"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-icon-secondary transition-colors duration-fast hover:text-icon-primary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.858a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-danger-500">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm leading-7 text-neutral-400 font-body">
                By creating an account, I agree to the{" "}
                <a href="#" className="font-bold text-text-brand">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-bold text-text-brand">
                  Privacy Policy.
                </a>
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[12px] border border-bg-brand bg-bg-brand px-3 py-2 text-sm font-semibold text-text-inverse shadow-sm transition-colors duration-fast hover:bg-bg-brand-hover active:bg-bg-brand-pressed focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-48 font-body"
              >
                {isLoading ? "Creating account..." : "Sign Up"}
                {!isLoading && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-[15px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-center gap-6">
              <div className="h-px flex-1 bg-border-subtle" />
              <span className="text-sm font-semibold leading-7 text-neutral-400 font-body">
                OR CONTINUE WITH
              </span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>

            <button
              type="button"
              className="mt-6 flex h-[42px] w-full items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-neutral-900 px-3 py-2 text-sm font-semibold text-text-inverse transition-colors duration-fast hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 font-body"
            >
              <GoogleIcon />
              Google
            </button>

            <p className="mt-5 text-center text-sm text-text-secondary font-body">
              Already have an account?{" "}
              <Link
                to="/sign-in"
                className="font-semibold text-text-brand transition-colors duration-fast hover:text-brand-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SignUp;
