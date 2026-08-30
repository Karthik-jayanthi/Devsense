"use client";

import { useEffect, useState } from "react";

type ConnectedRepo = { id: string; full_name: string; indexing_status: string };
type Doc = { id: string; doc_type: string; content_markdown: string; generated_at: string };

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DocumentationPage() {
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [generating, setGenerating] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/repositories/`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const ready = data.filter((r: ConnectedRepo) => r.indexing_status === "ready");
        setRepos(ready);
        if (ready.length > 0) setSelectedRepo(ready[0].id);
      });
  }, []);

  const loadDocs = (repoId: string) => {
    fetch(`${API}/api/v1/repositories/${repoId}/documents`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setDocs(data);
        if (data.length > 0) setActiveDoc(data[0]);
      });
  };

  useEffect(() => {
    if (selectedRepo) loadDocs(selectedRepo);
  }, [selectedRepo]);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch(`${API}/api/v1/repositories/${selectedRepo}/generate-readme`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    setGenerating(false);
    loadDocs(selectedRepo);
    setActiveDoc({
      id: data.id,
      doc_type: "readme",
      content_markdown: data.content,
      generated_at: new Date().toISOString(),
    });
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Documentation
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        AI-generated documentation grounded in your indexed code.
      </p>

      {repos.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-8 text-center text-sm text-[var(--text-secondary)]">
          Connect and fully index a repository first.
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
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 rounded-md bg-[var(--accent)] text-white text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {generating ? "Generating... (this can take a minute)" : "Generate README"}
            </button>
          </div>

          {activeDoc ? (
            <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-6">
              <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-sans">
                {activeDoc.content_markdown}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              No documentation generated yet. Click &quot;Generate README&quot; above.
            </p>
          )}
        </>
      )}
    </div>
  );
}