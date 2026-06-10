import { useEffect, useMemo, useState } from "react";
import Button from "../ui/Button.jsx";
import TextInput from "../ui/TextInput.jsx";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const NAME_PATTERN = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const FALLBACK_AVATAR =
  "https://www.figma.com/api/mcp/asset/67753a3d-3549-4da3-b837-ca8737b2faf5";

function IdentityPanel({ user, onNameSave, onAvatarUpload }) {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setFormData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
    });
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const initials = useMemo(() => {
    const first = user?.first_name?.[0] || "";
    const last = user?.last_name?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [user]);

  const avatarUrl = previewUrl || user?.profile_picture_url || FALLBACK_AVATAR;
  const joinedAt = user?.created_at
    ? new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(user.created_at))
    : "Not provided";

  const validateName = () => {
    const nextErrors = {};
    const firstName = formData.first_name.trim();
    const lastName = formData.last_name.trim();

    if (!firstName) nextErrors.first_name = "First name is required";
    else if (firstName.length > 50) nextErrors.first_name = "Use 50 characters or fewer";
    else if (!NAME_PATTERN.test(firstName)) nextErrors.first_name = "Use letters, apostrophes, or hyphens only";

    if (!lastName) nextErrors.last_name = "Last name is required";
    else if (lastName.length > 50) nextErrors.last_name = "Use 50 characters or fewer";
    else if (!NAME_PATTERN.test(lastName)) nextErrors.last_name = "Use letters, apostrophes, or hyphens only";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNameSubmit = async (event) => {
    event.preventDefault();
    if (!validateName()) return;

    setIsSaving(true);
    await onNameSave({
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
    });
    setIsSaving(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setErrors((prev) => ({ ...prev, avatar: "" }));

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, avatar: "Choose a valid image file" }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, avatar: "Image must be smaller than 5 MB" }));
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAvatarSubmit = async () => {
    if (!selectedFile) {
      setErrors((prev) => ({ ...prev, avatar: "Choose an image to upload" }));
      return;
    }

    setIsUploading(true);
    try {
      await onAvatarUpload(selectedFile);
      setSelectedFile(null);
      setPreviewUrl("");
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        avatar: err.message || "Failed to upload avatar",
      }));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[12px] border border-border-subtle bg-bg-surface shadow-sm">
      <header className="grid gap-5 border-b border-border-subtle bg-bg-subtle/60 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <figure className="relative size-24">
          <img
            src={avatarUrl}
            alt={`${initials} avatar`}
            className="size-24 rounded-full border-4 border-bg-surface object-cover shadow-sm"
          />
          <figcaption className="sr-only">{initials}</figcaption>
        </figure>

        <hgroup>
          <p className="font-display text-sm font-bold uppercase tracking-wider text-text-secondary">
            Identity
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-text-primary">
            {[user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
              "Your profile"}
          </h2>
          <p className="mt-1 break-words font-body text-sm leading-6 text-text-secondary">
            {user?.email || "No email available"}
          </p>
        </hgroup>

        <span className="inline-flex min-h-10 items-center justify-center rounded-full border border-border-subtle bg-bg-surface px-4 font-body text-sm font-semibold text-text-secondary">
          {user?.is_verified ? "Verified account" : "Verification pending"}
        </span>
      </header>

      <form
        onSubmit={handleNameSubmit}
        className="grid gap-4 p-5 sm:grid-cols-2"
        noValidate
      >
        <TextInput
          id="profile-first-name"
          label="First name"
          value={formData.first_name}
          error={errors.first_name}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, first_name: event.target.value }))
          }
          autoComplete="given-name"
        />
        <TextInput
          id="profile-last-name"
          label="Last name"
          value={formData.last_name}
          error={errors.last_name}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, last_name: event.target.value }))
          }
          autoComplete="family-name"
        />
        <p className="font-body text-sm text-text-secondary sm:col-span-2">
          Joined {joinedAt}
        </p>
        <footer className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-text-secondary">
            This name is used across your Meetra workspace.
          </p>
          <Button type="submit" disabled={isSaving} className="w-full sm:w-fit">
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </footer>
      </form>

      <footer className="grid gap-3 border-t border-border-subtle p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="flex-1">
          <span className="mb-2 block font-label text-sm font-semibold leading-7 text-text-primary">
            Profile photo
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full rounded-[12px] border border-border-subtle bg-bg-surface px-4 py-3 font-body text-sm text-text-secondary file:mr-4 file:rounded-[8px] file:border-0 file:bg-bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-text-inverse hover:file:bg-bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          {errors.avatar && (
            <span className="mt-2 block font-body text-xs font-medium text-danger-700">
              {errors.avatar}
            </span>
          )}
        </label>
        <Button
          type="button"
          onClick={handleAvatarSubmit}
          disabled={isUploading || !selectedFile}
          variant="secondary"
          className="w-full sm:w-fit"
        >
          {isUploading ? "Uploading..." : "Upload photo"}
        </Button>
      </footer>
    </section>
  );
}

export default IdentityPanel;
