"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Bot,
  Boxes,
  Network,
  Search,
  GitPullRequest,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Repositories", href: "/repositories", icon: GitBranch },
  { label: "AI Assistant", href: "/assistant", icon: Bot },
  { label: "Architecture", href: "/architecture", icon: Boxes },
  { label: "Knowledge Graph", href: "/graph", icon: Network },
  { label: "Search", href: "/search", icon: Search },
  { label: "Pull Requests", href: "/pull-requests", icon: GitPullRequest },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Documentation", href: "/documentation", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-[var(--border)]">
        <Image
          src="/devsense-logo.png"
          alt="DevSense"
          width={120}
          height={22}
          priority
          style={{ width: "auto", height: "20px" }}
        />
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                active
                  ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}