"use client";

import { useEffect, useState } from "react";

type ConnectedRepo = { id: string; full_name: string; indexing_status: string };
type PR = {
  number: number;
  title: string;
  author: string;
  state: string;
  risk_score: number | null;
  additions: number;
  deletions: number;
  changed_files: number;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function PullRequestsPage() {
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/v1/repositories/`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setRepos(data);
        if (data.length > 0) setSelectedRepo(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedRepo) return;
    setLoading(true);
    fetch(`${API}/api/v1/repositories/${selectedRepo}/pull-requests`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setPrs(data);
        setLoading(false);
      });
  }, [selectedRepo]);

  function riskColor(score: number | null) {
    if (score === null) return "var(--text-secondary)";
    if (score < 3) return "var(--success)";
    if (score < 6) return "var(--warning)";
    return "var(--error)";
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Pull Requests
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Risk scores and diff size for pull requests received via webhook.
      </p>

      {repos.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-8 text-center text-sm text-[var(--text-secondary)]">
          Connect a repository first, then set up its GitHub webhook.
        </div>
      ) : (
        <>
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="mb-6 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name}
              </option>
            ))}
          </select>

          {loading && (
            <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
          )}

          {!loading && prs.length === 0 && (
            <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-8 text-center text-sm text-[var(--text-secondary)]">
              No pull requests received yet. Open a PR on this repository to see it here.
            </div>
          )}

          <div className="space-y-2">
            {prs.map((pr) => (
              <div
                key={pr.number}
                className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--text-primary)] font-medium">
                    #{pr.number} {pr.title}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ color: riskColor(pr.risk_score) }}
                  >
                    Risk: {pr.risk_score ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span>{pr.author}</span>
                  <span>{pr.state}</span>
                  <span>
                    +{pr.additions} -{pr.deletions} · {pr.changed_files} files
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}