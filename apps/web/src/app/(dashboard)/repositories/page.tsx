"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type AvailableRepo = {
  github_repo_id: number;
  full_name: string;
  private: boolean;
  default_branch: string;
  language: string | null;
};

type ConnectedRepo = {
  id: string;
  full_name: string;
  indexing_status: string;
  primary_language: string | null;
  file_count: number | null;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function RepositoriesPage() {
  const [available, setAvailable] = useState<AvailableRepo[]>([]);
  const [connected, setConnected] = useState<ConnectedRepo[]>([]);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [reindexing, setReindexing] = useState<string | null>(null);

  const loadConnected = useCallback(async () => {
    const res = await fetch(`${API}/api/v1/repositories/`, { credentials: "include" });
    if (res.ok) setConnected(await res.json());
  }, []);

  useEffect(() => {
    fetch(`${API}/api/v1/repositories/available`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setAvailable);
    loadConnected();
  }, [loadConnected]);

  useEffect(() => {
    const stillWorking = connected.some(
      (r) => r.indexing_status === "queued" || r.indexing_status === "indexing"
    );
    if (!stillWorking) return;
    const interval = setInterval(loadConnected, 3000);
    return () => clearInterval(interval);
  }, [connected, loadConnected]);

  async function handleConnect(repo: AvailableRepo) {
    setConnecting(repo.github_repo_id);

    const connectRes = await fetch(`${API}/api/v1/repositories/connect`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        github_repo_id: repo.github_repo_id,
        full_name: repo.full_name,
        default_branch: repo.default_branch,
        private: repo.private,
        language: repo.language,
      }),
    });
    const connectData = await connectRes.json();

    await fetch(`${API}/api/v1/repositories/${connectData.id}/index`, {
      method: "POST",
      credentials: "include",
    });

    await loadConnected();
    setConnecting(null);
  }

  async function handleReindex(repositoryId: string) {
    setReindexing(repositoryId);
    await fetch(`${API}/api/v1/repositories/${repositoryId}/index`, {
      method: "POST",
      credentials: "include",
    });
    await loadConnected();
    setReindexing(null);
  }

  const connectedNames = new Set(connected.map((r) => r.full_name));

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Repositories
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Connect a repository to start indexing.
      </p>

      {connected.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Connected
          </h2>
          <div className="space-y-2">
            {connected.map((repo) => (
              <Link
                key={repo.id}
                href={`/repositories/${repo.id}`}
                className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] rounded-lg px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div>
                  <span className="text-sm text-[var(--text-primary)]">
                    {repo.full_name}
                  </span>
                  {repo.file_count !== null && (
                    <span className="ml-3 text-xs text-[var(--text-secondary)]">
                      {repo.file_count} files · {repo.primary_language ?? "—"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={repo.indexing_status} />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleReindex(repo.id);
                    }}
                    disabled={reindexing === repo.id}
                    aria-label={`Re-index ${repo.full_name}`}
                    className="text-xs px-2 py-1 rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
                  >
                    {reindexing === repo.id ? "Re-indexing..." : "Re-index"}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
        Available on GitHub
      </h2>
      <div className="space-y-2">
        {available
          .filter((repo) => !connectedNames.has(repo.full_name))
          .map((repo) => (
            <div
              key={repo.github_repo_id}
              className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] rounded-lg px-4 py-3"
            >
              <div>
                <span className="text-sm text-[var(--text-primary)]">
                  {repo.full_name}
                </span>
                {repo.private && (
                  <span className="ml-3 text-xs text-[var(--warning)]">private</span>
                )}
              </div>
              <button
                onClick={() => handleConnect(repo)}
                disabled={connecting === repo.github_repo_id}
                aria-label={`Connect and index ${repo.full_name}`}
                className="text-xs px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {connecting === repo.github_repo_id ? "Connecting..." : "Connect & Index"}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ready: "var(--success)",
    indexing: "var(--warning)",
    queued: "var(--warning)",
    failed: "var(--error)",
    never: "var(--text-secondary)",
  };
  return (
    <span
      className="text-xs px-2 py-1 rounded"
      style={{ color: colors[status] ?? "var(--text-secondary)" }}
    >
      {status}
    </span>
  );
}