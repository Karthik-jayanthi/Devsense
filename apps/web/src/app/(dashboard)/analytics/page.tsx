"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ConnectedRepo = { id: string; full_name: string; indexing_status: string };
type Analytics = {
  commit_velocity: { week: string; commits: number }[];
  total_commits: number;
  total_additions: number;
  total_deletions: number;
  total_prs: number;
  avg_pr_risk: number | null;
  open_prs: number;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AnalyticsPage() {
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/repositories/`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((repoData) => {
        setRepos(repoData);
        if (repoData.length > 0) setSelectedRepo(repoData[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedRepo) return;
    fetch(`${API}/api/v1/repositories/${selectedRepo}/analytics`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setData);
  }, [selectedRepo]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Analytics
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Engineering activity computed from indexed commits and pull requests.
      </p>

      {repos.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-8 text-center text-sm text-[var(--text-secondary)]">
          Connect and index a repository first.
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

          {!data ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <StatCard label="Total commits" value={data.total_commits} />
                <StatCard label="Lines added" value={`+${data.total_additions}`} color="var(--success)" />
                <StatCard label="Lines removed" value={`-${data.total_deletions}`} color="var(--error)" />
                <StatCard label="Total PRs" value={data.total_prs} />
                <StatCard
                  label="Avg PR risk"
                  value={data.avg_pr_risk ?? "—"}
                  color={
                    data.avg_pr_risk === null
                      ? undefined
                      : data.avg_pr_risk < 3
                      ? "var(--success)"
                      : data.avg_pr_risk < 6
                      ? "var(--warning)"
                      : "var(--error)"
                  }
                />
              </div>

              <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-5">
                <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">
                  Commit velocity (last 12 weeks)
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.commit_velocity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                      interval={1}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="commits"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-4">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className="text-lg font-semibold"
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}