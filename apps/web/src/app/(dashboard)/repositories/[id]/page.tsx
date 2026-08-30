"use client";

import { useEffect, useState, use } from "react";

type RepoDetail = {
  full_name: string;
  indexing_status: string;
  primary_language: string | null;
  languages: Record<string, number> | null;
  file_count: number | null;
  contributors: { login: string; commit_count: number }[];
  commits: {
    sha: string;
    message: string;
    committed_at: string | null;
    additions: number;
    deletions: number;
  }[];
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [repo, setRepo] = useState<RepoDetail | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/repositories/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then(setRepo);
  }, [id]);

  if (!repo) {
    return <p className="text-sm text-[var(--text-secondary)]">Loading...</p>;
  }

  const languageEntries = Object.entries(repo.languages ?? {}).sort(
    (a, b) => b[1] - a[1]
  );
  const totalFiles = languageEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        {repo.full_name}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        {repo.file_count} files · {repo.primary_language ?? "unknown language"}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-5">
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Languages
          </h2>
          <div className="space-y-2">
            {languageEntries.map(([lang, count]) => {
              const pct = totalFiles ? Math.round((count / totalFiles) * 100) : 0;
              return (
                <div key={lang}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-primary)]">{lang}</span>
                    <span className="text-[var(--text-secondary)]">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-5">
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Contributors
          </h2>
          <div className="space-y-2">
            {repo.contributors.map((c) => (
              <div key={c.login} className="flex justify-between text-xs">
                <span className="text-[var(--text-primary)] truncate">{c.login}</span>
                <span className="text-[var(--text-secondary)]">
                  {c.commit_count} commits
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Recent commits
          </h2>
          <div className="space-y-3">
            {repo.commits.map((c) => (
              <div
                key={c.sha}
                className="flex items-start justify-between text-xs border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <span className="text-[var(--accent)] mr-2">{c.sha}</span>
                  <span className="text-[var(--text-primary)]">{c.message}</span>
                </div>
                <span className="text-[var(--text-secondary)] shrink-0 ml-4">
                  +{c.additions} -{c.deletions}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
