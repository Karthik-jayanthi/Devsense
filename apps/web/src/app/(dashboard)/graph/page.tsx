"use client";

import dagre from "dagre";
import { useEffect, useState, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

type ApiNode = { id: string; label: string; name: string };
type ApiEdge = { id: string; source: string; target: string; label: string };

const API = process.env.NEXT_PUBLIC_API_URL;

const LABEL_COLORS: Record<string, string> = {
  Repository: "#ff5a3c",
  File: "#3b6ff6",
  Class: "#10b981",
  Function: "#f59e0b",
};

export default function GraphPage() {
  const [repos, setRepos] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [apiNodes, setApiNodes] = useState<ApiNode[]>([]);
  const [apiEdges, setApiEdges] = useState<ApiEdge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/v1/repositories/`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setRepos(data);
        if (data.length > 0) setSelectedRepo(data[0].id);
      });
  }, []);

  const loadGraph = useCallback((repoId: string) => {
    if (!repoId) return;
    setLoading(true);
    fetch(`${API}/api/v1/repositories/${repoId}/graph`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setApiNodes(data.nodes ?? []);
        setApiEdges(data.edges ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedRepo) loadGraph(selectedRepo);
  }, [selectedRepo, loadGraph]);

    const { flowNodes, flowEdges } = useMemo(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 80 });
    g.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 160;
    const nodeHeight = 40;

    apiNodes.forEach((n) => {
      g.setNode(n.id, { width: nodeWidth, height: nodeHeight });
    });
    apiEdges.forEach((e) => {
      g.setEdge(e.source, e.target);
    });

    dagre.layout(g);

    const flowNodes: Node[] = apiNodes.map((n) => {
      const pos = g.node(n.id);
      return {
        id: n.id,
        position: { x: pos.x, y: pos.y },
        data: { label: n.name },
        style: {
          background: LABEL_COLORS[n.label] ?? "#8b92a0",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 11,
          width: nodeWidth,
        },
      };
    });

    const flowEdges: Edge[] = apiEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      style: { stroke: "var(--border)" },
      labelStyle: { fill: "var(--text-secondary)", fontSize: 10 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--border)" },
    }));

    return { flowNodes, flowEdges };
  }, [apiNodes, apiEdges]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Knowledge Graph
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Files, classes, and functions extracted from your indexed repository.
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
            Loading graph...
          </div>
        ) : apiNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)]">
            No graph data yet — this repo may not have any Python files to parse.
          </div>
        ) : (
          <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
            <Background color="var(--border)" gap={20} />
            <Controls />
            <MiniMap
              nodeColor={(n) => (n.style?.background as string) ?? "#8b92a0"}
              maskColor="rgba(0,0,0,0.4)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}