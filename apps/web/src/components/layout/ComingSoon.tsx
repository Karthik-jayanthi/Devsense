import { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  milestone,
  description,
}: {
  icon: LucideIcon;
  title: string;
  milestone: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">{description}</p>

      <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg p-12 flex flex-col items-center text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--surface-hover)" }}
        >
          <Icon size={22} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
        </div>
        <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
          Not built yet
        </p>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm">
          This feature is planned for <span style={{ color: "var(--accent)" }}>{milestone}</span> on
          the roadmap. Connect and index a repository from the Repositories page
          in the meantime.
        </p>
      </div>
    </div>
  );
}
