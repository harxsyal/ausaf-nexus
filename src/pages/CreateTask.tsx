import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, FileText, Send, Bell, Loader2 } from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole, roleHomePath } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ---------- Schema ----------
const Department = z.enum(["social", "website", "production"]);
type Dept = z.infer<typeof Department>;

const schema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  department: Department,
  content_type: z.string().trim().min(1, "Required").max(40),
  platform: z.string().trim().max(40).optional().or(z.literal("")),
  asset_page: z.string().trim().max(120).optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigned_to: z.string().trim().max(120).optional().or(z.literal("")),
  assigned_by: z.string().trim().max(120).optional().or(z.literal("")),
  deadline_date: z.date().optional(),
  deadline_time: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "HH:MM").optional().or(z.literal("")),
  caption_draft: z.string().trim().max(2000).optional().or(z.literal("")),
  publish_title_draft: z.string().trim().max(200).optional().or(z.literal("")),
  source: z.string().trim().max(200).optional().or(z.literal("")),
  reference_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

const SOCIAL_PLATFORMS = ["facebook", "youtube", "instagram", "tiktok", "x"];
const SOCIAL_CONTENT = ["post", "poster", "reel", "breaking"];
const WEBSITE_CONTENT = ["news", "original", "postcard"];
const PRODUCTION_CONTENT = ["video", "podcast", "documentary", "package", "graphics"];

const deptDefault = (role: AppRole | null): Dept => {
  if (role === "website") return "website";
  if (role === "production") return "production";
  return "social";
};

const CreateTask = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState<null | "draft" | "assign" | "notify">(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", description: "",
      department: deptDefault(role),
      content_type: "", platform: "", asset_page: "",
      priority: "medium",
      assigned_to: "", assigned_by: user?.email ?? "",
      deadline_time: "",
      caption_draft: "", publish_title_draft: "",
      source: "", reference_url: "", notes: "",
    },
  });

  // Re-default department once role hydrates
  useEffect(() => {
    if (role && !form.formState.isDirty) {
      form.setValue("department", deptDefault(role));
    }
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const dept = form.watch("department");
  const canSetDept = role === "super_admin";

  const contentOptions = useMemo(() => {
    if (dept === "social") return SOCIAL_CONTENT;
    if (dept === "website") return WEBSITE_CONTENT;
    return PRODUCTION_CONTENT;
  }, [dept]);

  // Reset content_type when dept switches
  useEffect(() => {
    form.setValue("content_type", "");
  }, [dept]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildDeadline = (d?: Date, t?: string) => {
    if (!d) return null;
    const out = new Date(d);
    if (t) {
      const [h, m] = t.split(":").map(Number);
      out.setHours(h, m, 0, 0);
    } else {
      out.setHours(23, 59, 0, 0);
    }
    return out.toISOString();
  };

  const buildNotesPayload = (v: FormValues) => {
    // Compose a single human-readable notes block to preserve fields not in schema
    const lines: string[] = [];
    if (v.description) lines.push(`Description: ${v.description}`);
    if (v.assigned_by) lines.push(`Assigned by: ${v.assigned_by}`);
    if (v.publish_title_draft) lines.push(`Publish title: ${v.publish_title_draft}`);
    if (v.caption_draft) lines.push(`Caption draft: ${v.caption_draft}`);
    if (v.reference_url) lines.push(`Reference: ${v.reference_url}`);
    if (v.notes) lines.push(`Notes: ${v.notes}`);
    return lines.join("\n");
  };

  const onSubmit = async (mode: "draft" | "assign" | "notify") => {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const v = form.getValues();
    const deadline = buildDeadline(v.deadline_date, v.deadline_time || undefined);
    const notes = buildNotesPayload(v);
    setSubmitting(mode);

    try {
      let error: any = null;

      if (v.department === "social") {
        const status = mode === "draft" ? "pending" : "in_progress";
        const platform = (v.platform || "facebook") as any;
        const ct = (v.content_type || "post") as any;
        const res = await supabase.from("social_tasks").insert({
          title: v.title,
          task_type: ct,
          platform,
          asset_page: v.asset_page || null,
          priority: v.priority as any,
          status: status as any,
          deadline,
          notes: notes || null,
          created_by: user?.id ?? null,
        });
        error = res.error;
      } else if (v.department === "website") {
        const status = mode === "draft" ? "draft" : "in_review";
        const at = (v.content_type || "news") as any;
        const res = await supabase.from("website_tasks").insert({
          headline: v.title,
          article_type: at,
          category: v.asset_page || null,
          writer: v.assigned_to || null,
          editor: null,
          deadline,
          status: status as any,
          url: v.reference_url || null,
          notes: notes || null,
          created_by: user?.id ?? null,
        });
        error = res.error;
      } else {
        const stage = mode === "draft" ? "idea_received" : "researching";
        const res = await supabase.from("production_tasks").insert({
          title: v.title,
          source: v.source || null,
          producer: v.assigned_to || null,
          target_platform: v.platform || null,
          deadline,
          stage: stage as any,
          notes: notes || null,
          created_by: user?.id ?? null,
        });
        error = res.error;
      }

      if (error) throw error;

      if (mode === "notify") {
        toast.success("Task assigned. Notification queued.");
      } else if (mode === "assign") {
        toast.success("Task assigned successfully.");
      } else {
        toast.success("Draft saved.");
      }
      navigate(roleHomePath(role));
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save task.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <DashboardLayout dept="Workspace" title="Create Task">
      <Form {...form}>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit("assign"); }}
          className="space-y-6"
        >
          {/* Section: Routing */}
          <Section title="Routing" subtitle="Where this task lives and who owns it.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!canSetDept}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                  {!canSetDept && (
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
                      Locked to your desk
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="content_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contentOptions.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </Section>

          {/* Section: Brief */}
          <Section title="Brief" subtitle="The story in one sentence, then the details.">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Task Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Breaking — Cabinet reshuffle announced" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Context, angle, audience, intent…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </Section>

          {/* Section: Distribution */}
          <Section title="Distribution" subtitle="Where it ships and which surface it lands on.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="platform" render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  {dept === "social" ? (
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input placeholder={dept === "website" ? "Web (optional)" : "YouTube, TV, Web…"} {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="asset_page" render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset / Page</FormLabel>
                  <FormControl>
                    <Input placeholder={dept === "website" ? "Category or section" : "Page handle / asset name"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </Section>

          {/* Section: Ownership */}
          <Section title="Ownership" subtitle="Who's on the byline.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="assigned_to" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <FormControl>
                    <Input placeholder="Name or handle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="assigned_by" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned By</FormLabel>
                  <FormControl>
                    <Input placeholder="You" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </Section>

          {/* Section: Deadline */}
          <Section title="Deadline" subtitle="When it must hit air.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="deadline_date" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="deadline_time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </Section>

          {/* Section: Drafts */}
          <Section title="Drafts" subtitle="Pre-write what ships with the asset.">
            <FormField control={form.control} name="publish_title_draft" render={({ field }) => (
              <FormItem>
                <FormLabel>Publish Title Draft</FormLabel>
                <FormControl>
                  <Input placeholder="The headline as it will appear publicly" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="caption_draft" render={({ field }) => (
              <FormItem>
                <FormLabel>Caption Draft</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Draft caption / lede…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </Section>

          {/* Section: Sources */}
          <Section title="Sources" subtitle="Trace where this came from.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="source" render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="Wire, exclusive, internal…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="reference_url" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Anything the desk needs to know." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </Section>

          {/* Action bar */}
          <div className="sticky bottom-0 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 bg-background/90 backdrop-blur border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {dept === "social" && "Routing → social_tasks"}
              {dept === "website" && "Routing → website_tasks"}
              {dept === "production" && "Routing → production_tasks"}
            </p>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button
                type="button" variant="outline"
                onClick={() => onSubmit("draft")}
                disabled={!!submitting}
              >
                {submitting === "draft" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileText className="size-4 mr-2" />}
                Save Draft
              </Button>
              <Button
                type="button" variant="secondary"
                onClick={() => onSubmit("assign")}
                disabled={!!submitting}
              >
                {submitting === "assign" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                Assign Task
              </Button>
              <Button
                type="button"
                onClick={() => onSubmit("notify")}
                disabled={!!submitting}
              >
                {submitting === "notify" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Bell className="size-4 mr-2" />}
                Assign &amp; Notify
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </DashboardLayout>
  );
};

const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <section className="border border-border bg-surface/40">
    <header className="px-5 py-3 border-b border-border">
      <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </header>
    <div className="p-5 space-y-4">{children}</div>
  </section>
);

export default CreateTask;
