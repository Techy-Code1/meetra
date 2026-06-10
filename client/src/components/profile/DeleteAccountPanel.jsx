import { useState } from "react";
import Button from "../ui/Button.jsx";
import TextInput from "../ui/TextInput.jsx";

function DeleteAccountPanel({ onDelete }) {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = password && confirmText === "DELETE";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required");
      return;
    }

    if (confirmText !== "DELETE") {
      setError("Type DELETE to confirm");
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete(password);
    } catch (err) {
      setError(err.message || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-[12px] border border-danger-100 bg-bg-surface p-5 shadow-sm">
      <header className="mb-5">
        <h2 className="font-display text-base font-bold text-danger-700">
          Delete account
        </h2>
        <p className="mt-1 font-body text-sm leading-6 text-text-secondary">
          This removes your access immediately and cannot be undone.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-[12px] border border-danger-100 bg-danger-100 px-4 py-3 font-body text-sm text-danger-700"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextInput
          id="delete-password"
          type="password"
          label="Current password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <TextInput
          id="delete-confirm"
          label="Confirmation"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder="Type DELETE"
        />

        <Button
          type="submit"
          disabled={!canDelete || isDeleting}
          className="w-full border-danger-600 bg-danger-600 text-text-inverse hover:bg-danger-700 active:bg-danger-800 sm:w-auto"
        >
          {isDeleting ? "Deleting..." : "Delete account"}
        </Button>
      </form>
    </section>
  );
}

export default DeleteAccountPanel;
