import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { CreateProductionTaskDialog, ProductionStage }
  from "@/components/production/CreateProductionTaskDialog";
import {
  Lightbulb, Search, Camera, Mic, Scissors, CheckCircle2,
  CalendarClock, Send, Plus, User, Clapperboard, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Card {
  id: string;
  title: string;
  source: string | null;
  reporter: string | null;
  editor: string | null;
  producer: string | null;
  deadline: string | null;
  target_platform: string | null;
  stage: ProductionStage;
}

const COLUMNS: { stage: ProductionStage; label: string; icon: any; tone: string }[] = [
  { stage: "idea_received", label: "Idea Received", icon: Lightbulb,    tone: "border-t-muted-foreground" },
  { stage: "researching",   label: "Researching",   icon: Search,       tone: "border-t-signal-blue" },
  { stage: "shooting",      label: "Shooting",      icon: Camera,       tone: "border-t-signal-amber" },
  { stage: "voice_over",    label: "Voice Over",    icon: Mic,          tone: "border-t-signal-amber" },
  { stage: "editing",       label: "Editing",       icon: Scissors,     tone: "border-t-signal-amber" },
  { stage: "ready",         label: "Ready",         icon: CheckCircle2, tone: "border-t-signal-green" },
  { stage: "scheduled",     label: "Scheduled",     icon: CalendarClock,tone: "border-t-signal-blue" },
  { stage: "published",     label: "Published",     icon: Send,         tone: "border-t-signal-green" },
];

const fmtDeadline = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const ProductionDashboard = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("production_tasks")
      .select("id,title,source,reporter,editor,producer,deadline,target_platform,stage")
      .order("deadline", { ascending: true, nullsFirst: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setCards((data ?? []) as Card[]);
  };
  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const m: Record<ProductionStage, Card[]> = {
      idea_received: [], researching: [], shooting: [], voice_over: [],
      editing: [], ready: [], scheduled: [], published: [],
    };
    cards.forEach((c) => m[c.stage].push(c));
    return m;
  }, [cards]);

  const advance = async (card: Card) => {
    const idx = COLUMNS.findIndex((c) => c.stage === card.stage);
    if (idx === -1 || idx === COLUMNS.length - 1) return;
    const next = COLUMNS[idx + 1].stage;
    // Optimistic update
    setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, stage: next } : c));
    const { error } = await supabase.from("production_tasks").update({ stage: next }).eq("id", card.id);
    if (error) { toast.error(error.message); load(); }
    else toast.success(`Moved to ${COLUMNS[idx + 1].label}`);
  };

  return (
    <DashboardLayout dept="Digital Production" title="Production Pipeline">
      {/* Top action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-border bg-surface text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Clapperboard className="size-3.5 text-primary" />
            {cards.length} Active Cards
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-signal-green/30 bg-signal-green/10 text-xs font-mono uppercase tracking-widest text-signal-green">
            <span className="size-1.5 rounded-full bg-signal-green animate-pulse" /> Pipeline Live
          </span>
        </div>
        <button onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest hover:bg-primary/90 transition-colors">
          <Plus className="size-3.5" /> New Production Task
        </button>
      </div>

      {/* Kanban board */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((col) => {
            const items = grouped[col.stage];
            return (
              <div key={col.stage} className={cn(
                "w-72 shrink-0 bg-surface/40 border border-border border-t-2 flex flex-col max-h-[calc(100vh-280px)]",
                col.tone
              )}>
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <col.icon className="size-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums px-1.5 py-0.5 bg-secondary border border-border">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {loading && (
                    <div className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground py-6 animate-pulse">
                      Loading…
                    </div>
                  )}
                  {!loading && items.length === 0 && (
                    <div className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground py-6 opacity-50">
                      Empty
                    </div>
                  )}
                  {items.map((c) => {
                    const overdue = c.deadline && new Date(c.deadline).getTime() < Date.now() && c.stage !== "published";
                    const isLast = col.stage === "published";
                    return (
                      <article key={c.id}
                        className="group bg-background border border-border hover:border-primary/60 transition-colors p-3 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{c.title}</h3>
                        </div>

                        {c.source && (
                          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            Source · <span className="text-foreground/80 normal-case tracking-normal">{c.source}</span>
                          </div>
                        )}

                        <div className="space-y-1 pt-1 border-t border-border/60">
                          {c.reporter && <Crew label="Reporter" name={c.reporter} />}
                          {c.editor && <Crew label="Editor" name={c.editor} />}
                          {c.producer && <Crew label="Producer" name={c.producer} />}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            {c.target_platform && (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-primary truncate">
                                → {c.target_platform}
                              </span>
                            )}
                            <span className={cn(
                              "text-[10px] font-mono tabular-nums",
                              overdue ? "text-signal-red" : "text-muted-foreground"
                            )}>
                              {fmtDeadline(c.deadline)}{overdue && " · OVERDUE"}
                            </span>
                          </div>
                          {!isLast && (
                            <button onClick={() => advance(c)}
                              title="Advance stage"
                              className="size-7 grid place-items-center border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shrink-0">
                              <ChevronRight className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CreateProductionTaskDialog open={open} onOpenChange={setOpen} onCreated={load} />
    </DashboardLayout>
  );
};

const Crew = ({ label, name }: { label: string; name: string }) => (
  <div className="flex items-center gap-2 text-[11px]">
    <User className="size-3 text-muted-foreground shrink-0" />
    <span className="text-muted-foreground font-mono uppercase text-[9px] tracking-widest w-14 shrink-0">{label}</span>
    <span className="truncate">{name}</span>
  </div>
);

export default ProductionDashboard;
