import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Pencil, UserCog, ArrowRight, CheckCircle2, Send, ExternalLink,
  Clock, MessageSquare, FileText, Tag, AlertTriangle, Loader2, Save, X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export type TaskDept = "social" | "website" | "production";

export interface TaskRef {
  dept: TaskDept;
  id: string;
}

const TABLE: Record<TaskDept, "social_tasks" | "website_tasks" | "production_tasks"> = {
  social: "social_tasks",
  website: "website_tasks",
  production: "production_tasks",
};

const TITLE_FIELD: Record<TaskDept, "title" | "headline"> = {
  social: "title", website: "headline", production: "title",
};

const STATUS_FIELD: Record<TaskDept, "status" | "stage"> = {
  social: "status", website: "status", production: "stage",
};

const STATUS_OPTIONS: Record<TaskDept, string[]> = {
  social: ["pending", "in_progress", "ready", "published", "delayed"],
  website: ["draft", "in_review", "ready", "published", "delayed"],
  production: ["idea_received", "researching", "shooting", "voice_over", "editing", "ready", "scheduled", "published"],
};

const READY_VALUE: Record<TaskDept, string> = {
  social: "ready", website: "ready", production: "ready",
};

const PUBLISHED_VALUE: Record<TaskDept, string> = {
  social: "published", website: "published", production: "published",
};

interface Props {
  task: TaskRef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

interface AnyTask {
  id: string;
  status?: string;
  stage?: string;
  title?: string;
  headline?: string;
  priority?: string | null;
  deadline?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // social
  task_type?: string; platform?: string; asset_page?: string | null;
  assigned_to?: string | null;
  // website
  article_type?: string; category?: string | null; language?: string;
  writer?: string | null; editor?: string | null; url?: string | null;
  // production
  source?: string | null; reporter?: string | null; producer?: string | null;
  target_platform?: string | null;
}

interface Comment {
  id: string; body: string; author_id: string | null;
  author_label: string | null; created_at: string;
}
interface EventRow {
  id: string; event_type: string; summary: string;
  actor_label: string | null; created_at: string;
}
interface Proof {
  id: string; url: string | null; caption: string | null;
  screenshot_path: string | null; published_at: string | null;
  submitted_by: string | null; created_at: string;
}

export const TaskDetailModal = ({ task, open, onOpenChange, onChanged }: Props) => {
  const { user } = useAuth();
  const [data, setData] = useState<AnyTask | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [proof, setProof] = useState<Proof | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<AnyTask>>({});
  const [newComment, setNewComment] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofCaption, setProofCaption] = useState("");

  const actorLabel = user?.email ?? "system";

  const load = async () => {
    if (!task) return;
    setLoading(true);
    const [t, c, e, p] = await Promise.all([
      supabase.from(TABLE[task.dept]).select("*").eq("id", task.id).maybeSingle(),
      supabase.from("task_comments").select("*").eq("task_dept", task.dept).eq("task_id", task.id).order("created_at", { ascending: false }),
      supabase.from("task_events").select("*").eq("task_dept", task.dept).eq("task_id", task.id).order("created_at", { ascending: false }),
      supabase.from("task_proof").select("*").eq("task_dept", task.dept).eq("task_id", task.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setLoading(false);
    if (t.error) { toast.error(t.error.message); return; }
    setData(t.data as any);
    setDraft({});
    setEditing(false);
    setComments((c.data ?? []) as any);
    setEvents((e.data ?? []) as any);
    setProof((p.data ?? null) as any);
    setProofUrl((p.data as any)?.url ?? "");
    setProofCaption((p.data as any)?.caption ?? "");
  };

  useEffect(() => {
    if (open && task) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, task?.dept]);

  const status = useMemo(() => {
    if (!data || !task) return "";
    return (data as any)[STATUS_FIELD[task.dept]] ?? "";
  }, [data, task]);

  const titleText = useMemo(() => {
    if (!data || !task) return "";
    return (data as any)[TITLE_FIELD[task.dept]] ?? "";
  }, [data, task]);

  const overdue = !!data?.deadline && new Date(data.deadline).getTime() < Date.now()
    && status !== "published";

  const writeEvent = async (type: string, summary: string) => {
    if (!task) return;
    await supabase.from("task_events").insert({
      task_dept: task.dept, task_id: task.id,
      event_type: type, summary,
      actor_id: user?.id ?? null, actor_label: actorLabel,
    });
  };

  const updateStatus = async (next: string) => {
    if (!task || !data) return;
    setBusy("status");
    const update: any = { [STATUS_FIELD[task.dept]]: next };
    const { error } = await (supabase.from(TABLE[task.dept]) as any).update(update).eq("id", task.id);
    if (error) { setBusy(null); toast.error(error.message); return; }
    await writeEvent("status_change", `Status → ${next.replace(/_/g, " ")}`);
    toast.success("Status updated");
    setBusy(null);
    await load();
    onChanged?.();
  };

  const reassign = async () => {
    if (!task || !data) return;
    const field = task.dept === "social" ? "assigned_to"
      : task.dept === "website" ? "writer" : "producer";
    const current = (data as any)[field] ?? "";
    const next = window.prompt("Reassign to (name / handle):", current);
    if (next === null) return;
    setBusy("reassign");
    const { error } = await (supabase.from(TABLE[task.dept]) as any).update({ [field]: next || null }).eq("id", task.id);
    if (error) { setBusy(null); toast.error(error.message); return; }
    await writeEvent("reassign", next ? `Reassigned to ${next}` : "Unassigned");
    toast.success("Reassigned");
    setBusy(null);
    await load();
    onChanged?.();
  };

  const saveEdit = async () => {
    if (!task || !data) return;
    setBusy("edit");
    const titleKey = TITLE_FIELD[task.dept];
    const patch: any = {};
    if (draft[titleKey as keyof AnyTask] !== undefined) patch[titleKey] = (draft as any)[titleKey];
    if (draft.deadline !== undefined) patch.deadline = draft.deadline;
    if (draft.notes !== undefined) patch.notes = draft.notes;
    if (draft.priority !== undefined && task.dept === "social") patch.priority = draft.priority;
    if (Object.keys(patch).length === 0) { setBusy(null); setEditing(false); return; }
    const { error } = await (supabase.from(TABLE[task.dept]) as any).update(patch).eq("id", task.id);
    if (error) { setBusy(null); toast.error(error.message); return; }
    await writeEvent("edit", `Edited ${Object.keys(patch).join(", ")}`);
    toast.success("Saved");
    setBusy(null);
    setEditing(false);
    await load();
    onChanged?.();
  };

  const addComment = async () => {
    if (!task || !newComment.trim()) return;
    setBusy("comment");
    const { error } = await supabase.from("task_comments").insert({
      task_dept: task.dept, task_id: task.id,
      body: newComment.trim(),
      author_id: user?.id ?? null, author_label: actorLabel,
    });
    if (error) { setBusy(null); toast.error(error.message); return; }
    setNewComment("");
    setBusy(null);
    const { data: c } = await supabase.from("task_comments").select("*")
      .eq("task_dept", task.dept).eq("task_id", task.id).order("created_at", { ascending: false });
    setComments((c ?? []) as any);
  };

  const saveProof = async () => {
    if (!task) return;
    setBusy("proof");
    if (proof) {
      const { error } = await supabase.from("task_proof").update({
        url: proofUrl || null, caption: proofCaption || null,
        published_at: new Date().toISOString(),
      }).eq("id", proof.id);
      if (error) { setBusy(null); toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("task_proof").insert({
        task_dept: task.dept, task_id: task.id,
        url: proofUrl || null, caption: proofCaption || null,
        published_at: new Date().toISOString(),
        submitted_by: user?.id ?? null,
      });
      if (error) { setBusy(null); toast.error(error.message); return; }
    }
    await writeEvent("proof", "Publish proof attached");
    toast.success("Proof saved");
    setBusy(null);
    await load();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[9px] font-mono uppercase tracking-widest">
                  {task.dept}
                </Badge>
                {status && (
                  <Badge variant="secondary" className="text-[9px] font-mono uppercase tracking-widest">
                    {status.replace(/_/g, " ")}
                  </Badge>
                )}
                {overdue && (
                  <Badge className="bg-signal-red/10 text-signal-red border-signal-red/40 text-[9px] font-mono uppercase tracking-widest">
                    <AlertTriangle className="size-3 mr-1" /> Overdue
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight truncate">
                {loading ? "Loading…" : titleText || "Untitled task"}
              </DialogTitle>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
                ID {task.id.slice(0, 8)} · Updated {data?.updated_at ? formatDistanceToNow(new Date(data.updated_at), { addSuffix: true }) : "—"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-5 space-y-6">
            {loading || !data ? (
              <div className="grid place-items-center py-20 text-muted-foreground text-xs font-mono uppercase tracking-widest">
                <Loader2 className="size-4 animate-spin mb-2" /> Fetching task
              </div>
            ) : (
              <>
                {/* Basic Info */}
                <Section icon={FileText} title="Basic Info">
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input
                          defaultValue={titleText}
                          onChange={(e) => setDraft((d) => ({ ...d, [TITLE_FIELD[task.dept]]: e.target.value }))}
                          maxLength={200}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Deadline</Label>
                          <Input
                            type="datetime-local"
                            defaultValue={data.deadline ? format(new Date(data.deadline), "yyyy-MM-dd'T'HH:mm") : ""}
                            onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                          />
                        </div>
                        {task.dept === "social" && (
                          <div>
                            <Label className="text-xs">Priority</Label>
                            <Select
                              defaultValue={data.priority ?? "medium"}
                              onValueChange={(v) => setDraft((d) => ({ ...d, priority: v }))}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Notes</Label>
                        <Textarea
                          rows={3}
                          defaultValue={data.notes ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                          maxLength={2000}
                        />
                      </div>
                    </div>
                  ) : (
                    <DefList items={[
                      ["Type", task.dept === "social" ? data.task_type : task.dept === "website" ? data.article_type : "production"],
                      ...(task.dept === "social" ? [["Platform", data.platform], ["Asset / Page", data.asset_page]] as const : []),
                      ...(task.dept === "website" ? [["Category", data.category], ["Language", data.language], ["URL", data.url ? <Linkish key="u" href={data.url} /> : null]] as const : []),
                      ...(task.dept === "production" ? [["Target Platform", data.target_platform]] as const : []),
                      ["Priority", task.dept === "social" ? data.priority : "—"],
                      ["Deadline", data.deadline ? format(new Date(data.deadline), "PPp") : "—"],
                      ["Created", format(new Date(data.created_at), "PPp")],
                    ]} />
                  )}
                </Section>

                {/* Assignment */}
                <Section icon={UserCog} title="Assignment">
                  <DefList items={
                    task.dept === "social" ? [["Assigned To", data.assigned_to]] :
                    task.dept === "website" ? [["Writer", data.writer], ["Editor", data.editor]] :
                    [["Reporter", data.reporter], ["Producer", data.producer], ["Editor", data.editor]]
                  } />
                </Section>

                {/* Caption / Title (drafts live in notes — show full notes) */}
                <Section icon={Tag} title="Caption / Title">
                  <p className="text-sm whitespace-pre-wrap text-foreground/90">
                    {data.notes?.match(/Publish title:.*/i)?.[0] ?? "—"}
                  </p>
                  <Separator className="my-3" />
                  <p className="text-sm whitespace-pre-wrap text-foreground/90">
                    {data.notes?.match(/Caption draft:[\s\S]*?(?=\n[A-Z][a-z]+:|$)/)?.[0] ?? "—"}
                  </p>
                </Section>

                {/* Source */}
                <Section icon={ExternalLink} title="Source">
                  {task.dept === "production" && data.source && (
                    <p className="text-sm mb-2"><span className="text-muted-foreground">Source:</span> {data.source}</p>
                  )}
                  {(() => {
                    const ref = data.notes?.match(/Reference:\s*(\S+)/)?.[1] ?? data.url;
                    return ref ? <Linkish href={ref} /> : <p className="text-sm text-muted-foreground">No source attached.</p>;
                  })()}
                </Section>

                {/* Timeline */}
                <Section icon={Clock} title="Timeline History">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No history yet — actions you take will be logged here.</p>
                  ) : (
                    <ol className="space-y-3 relative before:content-[''] before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-border">
                      {events.map((ev) => (
                        <li key={ev.id} className="pl-5 relative">
                          <span className="absolute left-0 top-2 size-2.5 rounded-full bg-primary border-2 border-background" />
                          <p className="text-sm font-medium">{ev.summary}</p>
                          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
                            {ev.actor_label ?? "system"} · {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </Section>

                {/* Comments */}
                <Section icon={MessageSquare} title={`Comments (${comments.length})`}>
                  <div className="space-y-2 mb-3">
                    <Textarea
                      rows={2}
                      placeholder="Leave a note for the desk…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value.slice(0, 1000))}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={addComment} disabled={!newComment.trim() || busy === "comment"}>
                        {busy === "comment" ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <Send className="size-3.5 mr-2" />}
                        Post
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {comments.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No comments yet.</p>
                    ) : comments.map((c) => (
                      <div key={c.id} className="border border-border bg-surface/40 p-3">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                          {c.author_label ?? "anon"} · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* Publish Proof */}
                <Section icon={CheckCircle2} title="Publish Proof">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Live URL</Label>
                      <Input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://…" maxLength={500} />
                    </div>
                    <div>
                      <Label className="text-xs">Caption / proof note</Label>
                      <Textarea rows={2} value={proofCaption} onChange={(e) => setProofCaption(e.target.value.slice(0, 1000))} placeholder="What shipped, where, and when." />
                    </div>
                    {proof?.published_at && (
                      <p className="text-[10px] font-mono uppercase tracking-widest text-signal-green">
                        Last proof: {format(new Date(proof.published_at), "PPp")}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={saveProof} disabled={busy === "proof"}>
                        {busy === "proof" ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <Save className="size-3.5 mr-2" />}
                        Save Proof
                      </Button>
                    </div>
                  </div>
                </Section>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Action bar */}
        <div className="border-t border-border px-6 py-3 bg-background flex flex-wrap gap-2 justify-end">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft({}); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={busy === "edit"}>
                {busy === "edit" ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <Save className="size-3.5 mr-2" />}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={!data}>
                <Pencil className="size-3.5 mr-2" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={reassign} disabled={!data || busy === "reassign"}>
                <UserCog className="size-3.5 mr-2" /> Reassign
              </Button>
              <StatusMenu
                dept={task.dept}
                current={status}
                disabled={!data || busy === "status"}
                onChange={updateStatus}
              />
              <Button
                variant="secondary" size="sm"
                onClick={() => updateStatus(READY_VALUE[task.dept])}
                disabled={!data || status === READY_VALUE[task.dept] || busy === "status"}
              >
                <CheckCircle2 className="size-3.5 mr-2" /> Mark Ready
              </Button>
              <Button
                size="sm"
                onClick={() => updateStatus(PUBLISHED_VALUE[task.dept])}
                disabled={!data || status === PUBLISHED_VALUE[task.dept] || busy === "status"}
              >
                <Send className="size-3.5 mr-2" /> Mark Published
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="border border-border bg-surface/40">
    <header className="px-4 py-2.5 border-b border-border flex items-center gap-2">
      <Icon className="size-3.5 text-muted-foreground" />
      <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold">{title}</h3>
    </header>
    <div className="p-4">{children}</div>
  </section>
);

const DefList = ({ items }: { items: readonly (readonly [string, any])[] }) => (
  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
    {items.filter(([, v]) => v !== undefined).map(([k, v]) => (
      <div key={k} className="flex items-baseline gap-3 min-w-0">
        <dt className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground shrink-0 w-28">{k}</dt>
        <dd className="text-sm truncate">{v ?? <span className="text-muted-foreground">—</span>}</dd>
      </div>
    ))}
  </dl>
);

const Linkish = ({ href }: { href: string }) => (
  <a href={href} target="_blank" rel="noreferrer"
    className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all">
    {href} <ExternalLink className="size-3 shrink-0" />
  </a>
);

const StatusMenu = ({ dept, current, disabled, onChange }: {
  dept: TaskDept; current: string; disabled?: boolean; onChange: (v: string) => void;
}) => (
  <Select value={current} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger className="h-8 w-[170px] text-xs">
      <ArrowRight className="size-3.5 mr-1" />
      <SelectValue placeholder="Change status" />
    </SelectTrigger>
    <SelectContent>
      {STATUS_OPTIONS[dept].map((s) => (
        <SelectItem key={s} value={s} className="text-xs capitalize">
          {s.replace(/_/g, " ")}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default TaskDetailModal;
