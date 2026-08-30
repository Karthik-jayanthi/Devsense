const WIDGETS = [
  "Repository Health",
  "Code Churn",
  "Pull Request Activity",
  "Contributor Map",
  "Deployment Status",
  "Technical Debt",
  "Open Issues",
  "Recent AI Insights",
  "Risk Score",
  "Dependency Overview",
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Dashboard
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Connect a repository to see live engineering health here.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {WIDGETS.map((title) => (
          <div
            key={title}
            className="border border-[var(--border)] bg-white rounded-lg p-4 h-32 flex flex-col justify-between shadow-glass shadow-glass-hover transition-shadow"
            style={{ borderTopColor: "var(--accent)", borderTopWidth: "2px" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {title}
              </span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">
              No data yet
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}