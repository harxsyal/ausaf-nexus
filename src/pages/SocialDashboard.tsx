import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/dashboard/Widgets";
import { supabase } from "@/integrations/supabase/client";
import { CreateSocialTaskDialog, SocialPlatform, SocialTaskType, TaskPriority }
  from "@/components/social/CreateSocialTaskDialog";
import { Facebook, Youtube, Instagram, Music2, Hash, Newspaper, Image as ImgIcon,
  Film, Megaphone, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TaskFilterBar, TaskFilters, applyTaskFilters } from "@/components/filters/TaskFilterBar";

interface Row {
  id: string; title: string; task_type: SocialTaskType; platform: SocialPlatform;
  asset_page: string | null; assigned_to: string | null;
  deadline: string | null; priority: TaskPriority;
  status: "pending" | "in_progress" | "ready" | "published" | "delayed";
}

const PLATFORMS: { key: SocialPlatform; label: string; icon: any }[] = [
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "tiktok", label: "TikTok", icon: Music2 },
  { key: "x", label: "X", icon: Hash },
];

const QUICK = [
  { type: "post" as SocialTaskType, label: "Create Post Task", icon: FileText },
  { type: "poster" as SocialTaskType, label: "Create Poster Task", icon: ImgIcon },
  { type: "reel" as SocialTaskType, label: "Create Reel Task", icon: Film },
  { type: "breaking" as SocialTaskType, label: "Create Breaking Task", icon: Megaphone },
];

const STATUS_TONE: Record<Row["status"], string> = {
  pending: "text-muted-foreground bg-muted/40 border-border",
  in_progress: "text-signal-amber bg-signal-amber/10 border-signal-amber/30",
  ready: "text-signal-blue bg-[hsl(var(--signal-blue))]/10 border-[hsl(var(--signal-blue))]/30",
  published: "text-signal-green bg-signal-green/10 border-signal-green/30",
  delayed: "text-signal-red bg-signal-red/10 border-signal-red/30",
};
const PRIORITY_TONE: Record<TaskPriority, string> = {
  low: "text-muted-foreground border-border",
  medium: "text-foreground border-border",
  high: "text-signal-amber border-signal-amber/40",
  urgent: "text-signal-red border-signal-red/40 bg-signal-red/10",
};

const fmtDeadline = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const SocialDashboard = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [filters, setFilters] = useState<Set<SocialPlatform>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<SocialTaskType>("post");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("social_tasks")
      .select("id,title,task_type,platform,asset_page,assigned_to,deadline,priority,status")
      .order("deadline", { ascending: true, nullsFirst: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => { load(); }, []);

  const togglePlatform = (p: SocialPlatform) => {
    const next = new Set(filters);
    next.has(p) ? next.delete(p) : next.add(p);
    setFilters(next);
  };

  const visible = useMemo(
    () => filters.size === 0 ? rows : rows.filter((r) => filters.has(r.platform)),
    [rows, filters]
  );

  const now = Date.now();
  const stats = useMemo(() => {
    const isToday = (iso: string | null) => iso && new Date(iso).toDateString() === new Date().toDateString();
    return [
      { label: "Pending Tasks",   value: String(rows.filter((r) => r.status === "pending").length), tone: "amber" as const },
      { label: "Published Today", value: String(rows.filter((r) => r.status === "published" && isToday(r.deadline)).length), tone: "green" as const },
      { label: "Delayed",         value: String(rows.filter((r) => r.status === "delayed" || (r.deadline && new Date(r.deadline).getTime() < now && r.status !== "published")).length), tone: "red" as const },
      { label: "Ready to Publish",value: String(rows.filter((r) => r.status === "ready").length), tone: "muted" as const },
    ];
  }, [rows, now]);

  const openDialog = (t: SocialTaskType) => { setDialogType(t); setDialogOpen(true); };

  return (
    <DashboardLayout dept="Social Media Desk" title="Campaign & Engagement Control">
      <StatsGrid stats={stats} />

      {/* Quick action buttons */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {QUICK.map((q) => (
          <button key={q.type} onClick={() => openDialog(q.type)}
            className="group flex items-center gap-3 p-4 border border-border bg-surface hover:border-primary/60 hover:bg-surface-elevated transition-colors text-left">
            <div className="size-9 grid place-items-center bg-primary/10 text-primary border border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
              <q.icon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{q.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">+ Dispatch</div>
            </div>
          </button>
        ))}
      </section>

      {/* Filter row */}
      <section className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-2">
          <FilterIcon className="size-3" /> Platform
        </span>
        {PLATFORMS.map((p) => {
          const active = filters.has(p.key);
          return (
            <button key={p.key} onClick={() => togglePlatform(p.key)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-foreground/40"
              )}>
              <p.icon className="size-3.5" /> {p.label}
            </button>
          );
        })}
        {filters.size > 0 && (
          <button onClick={() => setFilters(new Set())}
            className="ml-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </section>

      {/* Task table */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-[0.2em]">
          Social Dispatch Queue
        </h2>
        <div className="border border-border bg-surface/40 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Task Title</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Asset / Page</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-xs font-mono uppercase tracking-widest animate-pulse">Loading dispatch queue…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <Newspaper className="size-6 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No tasks match this filter.</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">Use the quick actions above to dispatch one.</p>
                </td></tr>
              )}
              {visible.map((r) => {
                const Plat = PLATFORMS.find((p) => p.key === r.platform)!;
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors group">
                    <td className="px-4 py-4">
                      <p className="font-medium group-hover:text-primary transition-colors">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase">{r.task_type}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Plat.icon className="size-3.5" /> {Plat.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{r.asset_page || "—"}</td>
                    <td className="px-4 py-4 text-xs">
                      {r.assigned_to ? (
                        <span className="font-mono text-muted-foreground">{r.assigned_to.slice(0, 8)}</span>
                      ) : <span className="text-muted-foreground">Unassigned</span>}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs tabular-nums text-muted-foreground">{fmtDeadline(r.deadline)}</td>
                    <td className="px-4 py-4">
                      <span className={cn("inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border", PRIORITY_TONE[r.priority])}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn("inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border", STATUS_TONE[r.status])}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <CreateSocialTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} initialType={dialogType} onCreated={load} />
    </DashboardLayout>
  );
};

export default SocialDashboard;
