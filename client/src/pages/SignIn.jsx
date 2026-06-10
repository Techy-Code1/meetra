import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthAside from "../components/ui/AuthAside.jsx";
import GoogleIcon from "../components/ui/GoogleIcon.jsx";
import { login } from "../lib/api.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignIn(values) {
  const errors = {};
  const identifier = values.identifier.trim();
  const password = values.password;

  if (!identifier) {
    errors.identifier = "Email is required.";
  } else if (!emailPattern.test(identifier)) {
    errors.identifier = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}

function SignIn() {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextFormData = { ...formData, [name]: value };

    setFormData(nextFormData);
    if (touchedFields[name]) {
      setFieldErrors(validateSignIn(nextFormData));
    }
    setApiError("");
  };

  const handleBlur = (e) => {
    setTouchedFields((prev) => ({ ...prev, [e.target.name]: true }));
    setFieldErrors(validateSignIn(formData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const errors = validateSignIn(formData);
    setFieldErrors(errors);
    setTouchedFields({ identifier: true, password: true });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await login({
        identifier: formData.identifier.trim(),
        password: formData.password,
      });

      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setApiError(err.message || "Invalid email or password.");
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
              Welcome to Meetra!
            </h1>
            <p className="mt-1 text-base leading-7 text-text-secondary">
              Please enter your details to sign in.
            </p>
          </div>

          <div className="rounded-[12px] border border-border-subtle bg-bg-surface p-4 shadow-sm">
            {apiError && (
              <div className="mb-4 rounded-[12px] border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-700 font-body">
                {apiError}
              </div>
            )}

            {location.state?.message && !apiError && (
              <div className="mb-4 rounded-[12px] bg-success-100 border border-success-100 px-4 py-3 text-sm text-success-700 font-body">
                {location.state.message}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="space-y-4 p-2">
                <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold leading-7 text-text-primary font-label"
                >
                  Email Address
                </label>
                <div
                  className={`flex h-[52px] items-center gap-3 rounded-[12px] border bg-bg-surface px-4 transition-colors duration-fast focus-within:ring-1 focus-within:ring-brand-500/20 ${
                    fieldErrors.identifier
                      ? "border-danger-500"
                      : "border-border-subtle focus-within:border-border-focus"
                  }`}
                >
                  <svg
                    className="size-5 shrink-0 text-icon-secondary"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm-.4 4.25-7.07 4.42a1 1 0 0 1-1.06 0L4.4 8.25 5.46 6.55 12 10.64l6.54-4.09 1.06 1.7Z" />
                  </svg>
                  <input
                    id="identifier"
                    name="identifier"
                    type="email"
                    required
                    placeholder="eze@meetra.so"
                    value={formData.identifier}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.identifier)}
                    aria-describedby={
                      fieldErrors.identifier ? "identifier-error" : undefined
                    }
                    className="min-w-0 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-subtle outline-none font-body"
                  />
                </div>
                {fieldErrors.identifier && (
                  <p
                    id="identifier-error"
                    className="mt-1.5 text-xs font-medium text-danger-700 font-body"
                  >
                    {fieldErrors.identifier}
                  </p>
                )}
                </div>

                <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold leading-7 text-text-primary font-label"
                  >
                    Password
                  </label>
                </div>
                <div
                  className={`flex h-[52px] items-center gap-3 rounded-[12px] border bg-bg-surface px-4 transition-colors duration-fast focus-within:ring-1 focus-within:ring-brand-500/20 ${
                    fieldErrors.password
                      ? "border-danger-500"
                      : "border-border-focus"
                  }`}
                >
                  <svg
                    className="size-5 shrink-0 text-icon-primary"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 8.73V16a2 2 0 1 1 2 0v1.73a1 1 0 1 1-2 0ZM10 9V7a2 2 0 1 1 4 0v2h-4Z" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={
                      fieldErrors.password ? "password-error" : undefined
                    }
                    className="min-w-0 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-subtle outline-none font-body"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex size-8 items-center justify-center rounded-md text-icon-secondary transition-colors duration-fast hover:text-icon-primary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                        className="h-4 w-4"
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
                {fieldErrors.password && (
                  <p
                    id="password-error"
                    className="mt-1.5 text-xs font-medium text-danger-700 font-body"
                  >
                    {fieldErrors.password}
                  </p>
                )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm font-semibold leading-7">
                <label className="inline-flex items-center gap-2 text-text-primary">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border-subtle text-brand-500 focus:ring-brand-500/30"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="text-text-brand transition-colors duration-fast hover:text-brand-700"
                >
                  Forget password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[12px] border border-bg-brand bg-bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors duration-fast hover:bg-bg-brand-hover active:bg-bg-brand-pressed focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-48 font-body"
              >
                {isLoading ? "Signing in..." : "Sign In"}
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

            <Link
              to="/sign-up"
              className="mt-5 flex h-[42px] items-center justify-center rounded-[12px] px-3 py-2 text-sm font-semibold text-text-brand transition-colors duration-fast hover:bg-bg-subtle"
            >
              Create Account instant
            </Link>

            <div className="mt-6 flex items-center gap-6">
              <div className="h-px flex-1 bg-border-subtle" />
              <span className="text-sm font-semibold leading-7 text-text-subtle font-body">
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
          </div>
        </div>
      </main>
    </div>
  );
}

export default SignIn;
