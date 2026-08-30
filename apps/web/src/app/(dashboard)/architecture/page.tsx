"use client";

import { useEffect, useState, useMemo } from "react";
import ReactFlow, { Background, Controls, Node } from "reactflow";
import "reactflow/dist/style.css";

type ConnectedRepo = { id: string; full_name: string; indexing_status: string };
type ArchNode = { id: string; label: string; class_count: number };

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ArchitecturePage() {
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [archNodes, setArchNodes] = useState<ArchNode[]>([]);
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
    fetch(`${API}/api/v1/repositories/${selectedRepo}/architecture`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setArchNodes(data.nodes ?? []);
        setLoading(false);
      });
  }, [selectedRepo]);

  const flowNodes: Node[] = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(archNodes.length || 1));
    return archNodes.map((n, i) => ({
      id: n.id,
      position: { x: (i % cols) * 200, y: Math.floor(i / cols) * 90 },
      data: { label: n.label },
            style: {
        background: n.class_count > 0 ? "var(--accent)" : "var(--surface-hover)",
        color: n.class_count > 0 ? "#fff" : "var(--text-primary)",
        border: "none",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 11,
        width: 180,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    }));
  }, [archNodes]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Architecture
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        File structure from your indexed repository. Highlighted files define classes.
      </p>

      <select
        value={selectedRepo}
        onChange={(e) => setSelectedRepo(e.target.value)}
        className="mb-4 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)]"
      >
        {repos.map((r) => (
          <option key={r.id} value={r.id}>
            {r.full_name}
          </option>
        ))}
      </select>

      <div
        className="border border-[var(--border)] rounded-lg overflow-hidden"
        style={{ height: 500, background: "var(--surface)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)]">
            Loading...
          </div>
        ) : archNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)] text-center px-8">
            No structure data yet — this repo may not have Python files for the parser to analyze.
          </div>
        ) : (
          <ReactFlow nodes={flowNodes} edges={[]} fitView>
            <Background color="var(--border)" gap={20} />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}