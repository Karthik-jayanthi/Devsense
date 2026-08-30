"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  github_id: number;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser);
  }, []);

  function handleSignOut() {
    window.location.href = `${API}/api/v1/auth/logout`;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Settings
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Your account and connection details.
      </p>

      <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-5 max-w-md">
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">
          Account
        </h2>

        {user ? (
          <div className="flex items-center gap-4 mb-6">
            {user.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={`${user.name ?? "User"}'s GitHub avatar`}
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div>
              <p className="text-sm text-[var(--text-primary)] font-medium">
                {user.name ?? "Unknown"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {user.email ?? `GitHub ID ${user.github_id}`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)] mb-6">Loading...</p>
        )}

        <button
          onClick={handleSignOut}
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
