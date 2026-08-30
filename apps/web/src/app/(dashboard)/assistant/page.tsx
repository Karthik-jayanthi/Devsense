"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type ConnectedRepo = { id: string; full_name: string; indexing_status: string };
type Message = { role: "user" | "assistant"; content: string };

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AssistantPage() {
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/repositories/`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const ready = data.filter((r: ConnectedRepo) => r.indexing_status === "ready");
        setRepos(ready);
        if (ready.length > 0) setSelectedRepo(ready[0].id);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendQuestion() {
    if (!input.trim() || !selectedRepo || streaming) return;

    const question = input;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setStreaming(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const url = `${API}/api/v1/assistant/chat?repository_id=${selectedRepo}&question=${encodeURIComponent(question)}`;
    const source = new EventSource(url, { withCredentials: true });

    source.onmessage = (event) => {
      if (event.data === "[DONE]") {
        source.close();
        setStreaming(false);
        return;
      }
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: updated[updated.length - 1].content + event.data,
        };
        return updated;
      });
    };

    source.onerror = () => {
      source.close();
      setStreaming(false);
    };
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        AI Assistant
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Ask questions about your indexed repository.
      </p>

      {repos.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-8 text-center text-sm text-[var(--text-secondary)]">
          Connect and fully index a repository first, then come back here.
        </div>
      ) : (
        <>
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="mb-4 self-start bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)]"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name}
              </option>
            ))}
          </select>

          <div
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="flex-1 overflow-y-auto border border-[var(--border)] bg-[var(--surface)] rounded-lg p-4 mb-4 space-y-4"
          >
            {messages.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">
                Ask something like &quot;what classes are in this repo?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-lg ${m.role === "user" ? "ml-auto" : ""}`}
              >
                <div
                  className="text-sm rounded-lg px-4 py-2"
                  style={{
                    background: m.role === "user" ? "var(--accent)" : "var(--surface-hover)",
                    color: m.role === "user" ? "#fff" : "var(--text-primary)",
                  }}
                >
                  {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
              aria-label="Ask a question about this repository"
              placeholder="Ask about this repository..."
              disabled={streaming}
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
            />
            <button
              onClick={sendQuestion}
              disabled={streaming || !input.trim()}
              aria-label="Send question"
              className="px-4 rounded-md bg-[var(--accent)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}