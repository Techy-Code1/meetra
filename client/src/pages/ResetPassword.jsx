import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../lib/api.js";
import AuthAside from "../components/ui/AuthAside.jsx";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const { email, resetToken } = location.state || {};

  useEffect(() => {
    if (!email || !resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, resetToken, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setApiError("");
  };

  const validate = () => {
    const errors = {};
    if (formData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters.";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError("");

    try {
      await resetPassword({
        email,
        resetToken,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      navigate("/sign-in", { 
        state: { message: "Password reset successfully. Please sign in with your new password." },
        replace: true 
      });
    } catch (err) {
      setApiError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !resetToken) return null;

  return (
    <div className="min-h-screen bg-bg-canvas lg:grid lg:grid-cols-[minmax(420px,40vw)_1fr]">
      <AuthAside />

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[524px]">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold leading-7 text-text-primary font-display">
              Set New Password
            </h1>
            <p className="mt-1 text-base leading-7 text-text-secondary">
              Please enter your new password below.
            </p>
          </div>

          <div className="rounded-[12px] border border-border-subtle bg-bg-surface p-6 shadow-sm">
            {apiError && (
              <div className="mb-4 rounded-[12px] border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-700 font-body">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-semibold leading-7 text-text-primary"
                  >
                    New Password
                  </label>
                  <div
                    className={`flex h-[52px] items-center gap-3 rounded-[12px] border bg-bg-surface px-4 transition-colors duration-fast focus-within:ring-1 focus-within:ring-brand-500/20 ${
                      fieldErrors.newPassword ? "border-danger-500" : "border-border-subtle focus-within:border-border-focus"
                    }`}
                  >
                    <svg className="size-5 shrink-0 text-icon-secondary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 8.73V16a2 2 0 1 1 2 0v1.73a1 1 0 1 1-2 0ZM10 9V7a2 2 0 1 1 4 0v2h-4Z" />
                    </svg>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="min-w-0 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-subtle outline-none font-body"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-icon-secondary hover:text-icon-primary"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <p className="mt-1.5 text-xs font-medium text-danger-700">{fieldErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold leading-7 text-text-primary"
                  >
                    Confirm New Password
                  </label>
                  <div
                    className={`flex h-[52px] items-center gap-3 rounded-[12px] border bg-bg-surface px-4 transition-colors duration-fast focus-within:ring-1 focus-within:ring-brand-500/20 ${
                      fieldErrors.confirmPassword ? "border-danger-500" : "border-border-subtle focus-within:border-border-focus"
                    }`}
                  >
                    <svg className="size-5 shrink-0 text-icon-secondary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 8.73V16a2 2 0 1 1 2 0v1.73a1 1 0 1 1-2 0ZM10 9V7a2 2 0 1 1 4 0v2h-4Z" />
                    </svg>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="min-w-0 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-subtle outline-none font-body"
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs font-medium text-danger-700">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[12px] border border-bg-brand bg-bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors duration-fast hover:bg-bg-brand-hover active:bg-bg-brand-pressed focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-48"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResetPassword;
