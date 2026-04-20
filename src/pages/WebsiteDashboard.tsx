import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/dashboard/Widgets";
import { supabase } from "@/integrations/supabase/client";
import { CreateWebsiteTaskDialog, WebArticleType, WebLanguage }
  from "@/components/website/CreateWebsiteTaskDialog";
import { Newspaper, FileText, PenSquare, ImagePlus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TaskFilterBar, TaskFilters, applyTaskFilters } from "@/components/filters/TaskFilterBar";

interface Row {
  id: string; headline: string; article_type: WebArticleType;
  category: string | null; language: WebLanguage;
  writer: string | null; editor: string | null;
  deadline: string | null;
  status: "draft" | "in_review" | "ready" | "published" | "delayed";
  url: string | null;
}

const QUICK = [
  { type: "news" as WebArticleType, label: "Create News Article", icon: Newspaper },
  { type: "original" as WebArticleType, label: "Create Original Article", icon: PenSquare },
  { type: "postcard" as WebArticleType, label: "Create Web Postcard", icon: ImagePlus },
];

const STATUS_TONE: Record<Row["status"], string> = {
  draft: "text-muted-foreground bg-muted/40 border-border",
  in_review: "text-signal-amber bg-signal-amber/10 border-signal-amber/30",
  ready: "text-signal-blue bg-[hsl(var(--signal-blue))]/10 border-[hsl(var(--signal-blue))]/30",
  published: "text-signal-green bg-signal-green/10 border-signal-green/30",
  delayed: "text-signal-red bg-signal-red/10 border-signal-red/30",
};

const LANG_LABEL: Record<WebLanguage, string> = { urdu: "اردو", english: "EN", other: "—" };

const fmtDeadline = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const WebsiteDashboard = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<WebArticleType>("news");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("website_tasks")
      .select("id,headline,article_type,category,language,writer,editor,deadline,status,url")
      .order("deadline", { ascending: true, nullsFirst: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const now = Date.now();
  const stats = useMemo(() => {
    const isToday = (iso: string | null) => iso && new Date(iso).toDateString() === new Date().toDateString();
    return [
      { label: "Draft Articles",   value: String(rows.filter((r) => r.status === "draft").length), tone: "muted" as const },
      { label: "Ready to Publish", value: String(rows.filter((r) => r.status === "ready").length), tone: "amber" as const },
      { label: "Published Today",  value: String(rows.filter((r) => r.status === "published" && isToday(r.deadline)).length), tone: "green" as const },
      { label: "Delayed",          value: String(rows.filter((r) => r.status === "delayed" || (r.deadline && new Date(r.deadline).getTime() < now && r.status !== "published")).length), tone: "red" as const },
    ];
  }, [rows, now]);

  const openDialog = (t: WebArticleType) => { setDialogType(t); setDialogOpen(true); };

  return (
    <DashboardLayout dept="Website Desk" title="Editorial & Publishing Pipeline">
      <StatsGrid stats={stats} />

      {/* Quick action buttons */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {QUICK.map((q) => (
          <button key={q.type} onClick={() => openDialog(q.type)}
            className="group flex items-center gap-3 p-4 border border-border bg-surface hover:border-primary/60 hover:bg-surface-elevated transition-colors text-left">
            <div className="size-9 grid place-items-center bg-primary/10 text-primary border border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <q.icon className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">{q.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">+ Dispatch</div>
            </div>
          </button>
        ))}
      </section>

      {/* Table */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-[0.2em]">
          Editorial Queue
        </h2>
        <div className="border border-border bg-surface/40 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Headline</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Lang</th>
                <th className="px-4 py-3 font-medium">Writer</th>
                <th className="px-4 py-3 font-medium">Editor</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">URL</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-xs font-mono uppercase tracking-widest animate-pulse">Loading editorial queue…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center">
                  <FileText className="size-6 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No articles yet.</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">Use the quick actions above to start a draft.</p>
                </td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors group">
                  <td className="px-4 py-4">
                    <p className="font-medium group-hover:text-primary transition-colors">{r.headline}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase">{r.article_type}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">{r.category || "—"}</td>
                  <td className="px-4 py-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 border border-border">{LANG_LABEL[r.language]}</span>
                  </td>
                  <td className="px-4 py-4 text-xs">{r.writer || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-4 text-xs">{r.editor || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-4 font-mono text-xs tabular-nums text-muted-foreground">{fmtDeadline(r.deadline)}</td>
                  <td className="px-4 py-4">
                    <span className={cn("inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border", STATUS_TONE[r.status])}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono">
                        Open <ExternalLink className="size-3" />
                      </a>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CreateWebsiteTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} initialType={dialogType} onCreated={load} />
    </DashboardLayout>
  );
};

export default WebsiteDashboard;
