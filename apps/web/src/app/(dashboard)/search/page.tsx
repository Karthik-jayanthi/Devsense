"use client";

import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";

type ConnectedRepo = { id: string; full_name: string; indexing_status: string };
type SearchResult = {
  file_path: string;
  chunk_type: string | null;
  symbol_name: string | null;
  start_line: number | null;
  end_line: number | null;
  content: string;
  score: number;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SearchPage() {
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/v1/repositories/`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const ready = data.filter((r: ConnectedRepo) => r.indexing_status === "ready");
        setRepos(ready);
        if (ready.length > 0) setSelectedRepo(ready[0].id);
      });
  }, []);

  async function runSearch() {
    if (!query.trim() || !selectedRepo) return;
    setLoading(true);
    setSearched(true);

    const res = await fetch(
      `${API}/api/v1/repositories/${selectedRepo}/search?q=${encodeURIComponent(query)}`,
      { credentials: "include" }
    );
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Search
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Semantic search across your indexed repository&apos;s code.
      </p>

      {repos.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-8 text-center text-sm text-[var(--text-secondary)]">
          Connect and fully index a repository first, then come back here.
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name}
                </option>
              ))}
            </select>

            <div className="flex-1 relative">
              <SearchIcon
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search for code, a function, a concept..."
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <button
              onClick={runSearch}
              disabled={loading || !query.trim()}
              className="px-4 rounded-md bg-[var(--accent)] text-white text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>

          {loading && (
            <p className="text-sm text-[var(--text-secondary)]">Searching...</p>
          )}

          {!loading && searched && results.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">No results found.</p>
          )}

          <div className="space-y-3">
            {results.map((r, i) => (
              <div
                key={i}
                className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-primary)] font-medium">
                    {r.file_path}
                    {r.symbol_name && (
                      <span className="text-[var(--text-secondary)] font-normal">
                        {" "}
                        — {r.chunk_type} {r.symbol_name}
                        {r.start_line && ` (lines ${r.start_line}-${r.end_line})`}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {Math.round(r.score * 100)}% match
                  </span>
                </div>
                <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap overflow-x-auto bg-[var(--surface-hover)] rounded p-3">
                  {r.content.slice(0, 400)}
                  {r.content.length > 400 ? "..." : ""}
                </pre>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}