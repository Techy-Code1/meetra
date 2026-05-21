import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar.jsx";
import AccountSummary from "../components/profile/AccountSummary.jsx";
import DeleteAccountPanel from "../components/profile/DeleteAccountPanel.jsx";
import IdentityPanel from "../components/profile/IdentityPanel.jsx";
import { deleteAccount, getProfile, uploadAvatar } from "../lib/api.js";

const PROFILE_NAME_OVERRIDES_KEY = "profileNameOverrides";

function getSavedNameOverride(userId) {
  if (!userId) return null;

  try {
    const overrides = JSON.parse(
      localStorage.getItem(PROFILE_NAME_OVERRIDES_KEY) || "{}"
    );
    return overrides[userId] || null;
  } catch {
    return null;
  }
}

function saveNameOverride(userId, name) {
  if (!userId) return;

  let overrides;
  try {
    overrides = JSON.parse(
      localStorage.getItem(PROFILE_NAME_OVERRIDES_KEY) || "{}"
    );
  } catch {
    overrides = {};
  }

  localStorage.setItem(
    PROFILE_NAME_OVERRIDES_KEY,
    JSON.stringify({ ...overrides, [userId]: name })
  );
}

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await getProfile();
        const savedName = getSavedNameOverride(response.data?.user_id);
        setUser({ ...response.data, ...savedName });
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          navigate("/sign-in", {
            replace: true,
            state: { message: "Please sign in to manage your profile." },
          });
          return;
        }

        setApiError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  const handleAvatarUpload = async (file) => {
    const response = await uploadAvatar(file);
    const nextAvatarUrl = response.data;

    setUser((prev) => ({
      ...prev,
      profile_picture_url: nextAvatarUrl,
    }));
    setStatusMessage("Profile photo updated.");
    setApiError("");
  };

  const handleNameSave = async (name) => {
    saveNameOverride(user?.user_id, name);
    setUser((prev) => ({ ...prev, ...name }));
    setStatusMessage("Name updated.");
    setApiError("");
  };

  const handleDeleteAccount = async (password) => {
    await deleteAccount({ password });
    localStorage.removeItem("accessToken");
    navigate("/sign-in", {
      replace: true,
      state: { message: "Your account has been deleted." },
    });
  };

  return (
    <div className="flex min-h-screen bg-bg-canvas">
      <Sidebar user={user} activeItem="profile" />

      <main className="flex flex-1 flex-col lg:pl-[300px]">
        <header className="border-b border-border-subtle bg-bg-surface px-5 py-6 lg:px-8">
          <nav className="mb-4 font-body text-sm text-text-secondary">
            <Link to="/dashboard" className="font-semibold text-text-brand hover:underline">
              Dashboard
            </Link>
            <span aria-hidden="true"> / Profile</span>
          </nav>

          <h1 className="font-display text-3xl font-bold text-text-primary">
            Profile settings
          </h1>
          <p className="mt-2 max-w-[680px] font-body text-base leading-7 text-text-secondary">
            Keep your meeting identity current and manage account-level actions.
          </p>
        </header>

        <section className="w-full max-w-[1180px] p-5 lg:p-8">
          {apiError && (
            <p
              role="alert"
              className="mb-5 rounded-[12px] border border-danger-100 bg-danger-100 px-4 py-3 font-body text-sm text-danger-700"
            >
              {apiError}
            </p>
          )}

          {statusMessage && !apiError && (
            <p
              aria-live="polite"
              className="mb-5 rounded-[12px] border border-success-100 bg-success-100 px-4 py-3 font-body text-sm text-success-700"
            >
              {statusMessage}
            </p>
          )}

          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[12px] border border-border-subtle bg-bg-surface">
              <div className="size-8 animate-spin rounded-full border-b-2 border-text-brand" />
            </div>
          ) : user ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <IdentityPanel
                user={user}
                onNameSave={handleNameSave}
                onAvatarUpload={handleAvatarUpload}
              />
              <aside className="space-y-5">
                <AccountSummary user={user} />
                <DeleteAccountPanel onDelete={handleDeleteAccount} />
              </aside>
            </div>
          ) : (
            <article className="rounded-[12px] border border-border-subtle bg-bg-surface p-6 shadow-sm">
              <h2 className="font-display text-xl font-semibold text-text-primary">
                Profile unavailable
              </h2>
              <p className="mt-2 font-body text-sm leading-6 text-text-secondary">
                Start the backend or sign in again to manage your profile.
              </p>
              <Link
                to="/sign-in"
                className="mt-5 inline-flex h-[42px] items-center justify-center rounded-[12px] border border-bg-brand bg-bg-brand px-4 py-2 font-body text-sm font-semibold text-text-inverse transition-colors hover:bg-bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                Sign in
              </Link>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}

export default Profile;
