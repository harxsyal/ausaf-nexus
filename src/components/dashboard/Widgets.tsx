interface Stat { label: string; value: string; meta?: string; tone?: "green" | "amber" | "red" | "muted"; }

export const StatsGrid = ({ stats }: { stats: Stat[] }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
    {stats.map((s) => (
      <div key={s.label} className="bg-surface p-5">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">{s.label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-light tabular-nums tracking-tight">{s.value}</span>
          {s.meta && (
            <span className={`text-[10px] font-mono ${
              s.tone === "green" ? "text-signal-green" :
              s.tone === "amber" ? "text-signal-amber" :
              s.tone === "red" ? "text-signal-red" : "text-muted-foreground"
            }`}>{s.meta}</span>
          )}
        </div>
      </div>
    ))}
  </div>
);

interface Task { id: string; title: string; sub: string; tag: string; status: "Processing" | "Reviewing" | "Staged" | "Done"; deadline: string; }

export const TaskTable = ({ title, tasks }: { title: string; tasks: Task[] }) => {
  const dot = (s: Task["status"]) =>
    s === "Processing" ? "bg-signal-amber animate-pulse-soft" :
    s === "Reviewing" ? "bg-signal-green" :
    s === "Done" ? "bg-signal-green" : "bg-muted-foreground";
  const tone = (s: Task["status"]) =>
    s === "Processing" ? "text-signal-amber" :
    s === "Reviewing" ? "text-signal-green" :
    s === "Done" ? "text-signal-green" : "text-muted-foreground";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-[0.2em]">{title}</h2>
        <button className="px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-mono uppercase hover:bg-primary/90 transition-colors">
          + New Dispatch
        </button>
      </div>
      <div className="border border-border bg-surface/40 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Slug / Headline</th>
              <th className="px-4 py-3 font-medium">Tag</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Deadline</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {tasks.map((t) => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors group">
                <td className="px-4 py-4 font-mono text-muted-foreground text-xs">{t.id}</td>
                <td className="px-4 py-4">
                  <p className="font-medium group-hover:text-primary transition-colors">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{t.sub}</p>
                </td>
                <td className="px-4 py-4"><span className="text-[10px] px-2 py-0.5 border border-border font-mono">{t.tag}</span></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${dot(t.status)}`} />
                    <span className={`text-[10px] font-mono uppercase ${tone(t.status)}`}>{t.status}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-mono text-xs tabular-nums text-muted-foreground">{t.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
