"use client";

import { Search, Bell, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function TopNav() {
  return (
    <header className="h-14 border-b border-[var(--border)] flex items-center justify-between px-5 bg-[var(--bg)]">
      <button
        aria-label="Select repository"
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
      >
        <span className="text-xs">Select repository</span>
        <ChevronDown size={14} />
      </button>

      <div className="flex-1 max-w-md mx-6 relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
        />
        <input
          type="text"
          aria-label="Search commits, code, and docs"
          placeholder="Search commits, code, docs..."
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md pl-9 pr-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Bell size={17} strokeWidth={1.75} />
        </button>
        <ThemeToggle />
        <div
          role="img"
          aria-label="User account"
          className="w-8 h-8 rounded-full bg-[var(--surface-hover)] border border-[var(--border)]"
        />
      </div>
    </header>
  );
}