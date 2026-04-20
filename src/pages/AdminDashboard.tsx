import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/dashboard/Widgets";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AnyTask = {
  id: string;
  title: string;
  dept: "Social" | "Website" | "Production";
  status: string;
  priority?: string | null;
  deadline: string | null;
  url?: string | null;
  owner?: string | null;
  updated_at: string;
};

const isToday = (iso: string | null) =>
  !!iso && new Date(iso).toDateString() === new Date().toDateString();
const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

const AdminDashboard = () => {
  const [tasks, setTasks] = useState<AnyTask[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [social, web, prod, profiles] = await Promise.all([
      supabase.from("social_tasks").select("id,title,status,priority,deadline,assigned_to,updated_at"),
      supabase.from("website_tasks").select("id,headline,status,deadline,writer,url,updated_at"),
      supabase.from("production_tasks").select("id,title,stage,deadline,producer,updated_at"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    setLoading(false);

    const errs = [social.error, web.error, prod.error].filter(Boolean);
    if (errs.length) toast.error(errs[0]!.message);

    const merged: AnyTask[] = [
      ...(social.data ?? []).map((r: any) => ({
        id: r.id, title: r.title, dept: "Social" as const,
        status: r.status, priority: r.priority, deadline: r.deadline,
        owner: r.assigned_to, updated_at: r.updated_at,
      })),
      ...(web.data ?? []).map((r: any) => ({
        id: r.id, title: r.headline, dept: "Website" as const,
        status: r.status, deadline: r.deadline,
        url: r.url, owner: r.writer, updated_at: r.updated_at,
      })),
      ...(prod.data ?? []).map((r: any) => ({
        id: r.id, title: r.title, dept: "Production" as const,
        status: r.stage, deadline: r.deadline,
        owner: r.producer, updated_at: r.updated_at,
      })),
    ];
    setTasks(merged);
    setEmployeeCount(profiles.count ?? 0);
  };
  useEffect(() => { load(); }, []);

  const now = Date.now();
  const COMPLETED = new Set(["published"]);
  const PENDING = new Set([
    "pending", "in_progress", "draft", "in_review", "ready",
    "idea_received", "researching", "shooting", "voice_over", "editing", "scheduled",
  ]);

  const isDelayed = (t: AnyTask) =>
    t.status === "delayed" ||
    (!!t.deadline && new Date(t.deadline).getTime() < now && !COMPLETED.has(t.status));

  const stats = useMemo(() => {
    const todayTasks = tasks.filter((t) => isToday(t.updated_at) || isToday(t.deadline));
    return [
      { label: "Total Tasks Today", value: String(todayTasks.length), tone: "muted" as const },
      { label: "Pending",           value: String(tasks.filter((t) => PENDING.has(t.status)).length), tone: "amber" as const },
      { label: "Completed",         value: String(tasks.filter((t) => COMPLETED.has(t.status)).length), tone: "green" as const, meta: "All-time" },
      { label: "Delayed",           value: String(tasks.filter(isDelayed).length), tone: "red" as const },
      { label: "Employees Active",  value: String(employeeCount), tone: "green" as const },
      { label: "Departments",       value: "3", meta: "+ Admin", tone: "muted" as const },
    ];
  }, [tasks, employeeCount, now]);

  // Tasks by department
  const byDept = useMemo(() => {
    const m: Record<string, number> = { Social: 0, Website: 0, Production: 0 };
    tasks.forEach((t) => { m[t.dept] = (m[t.dept] ?? 0) + 1; });
    return Object.entries(m).map(([dept, count]) => ({ dept, count }));
  }, [tasks]);

  // Completed by employee (top 6)
  const byEmployee = useMemo(() => {
    const m = new Map<string, number>();
    tasks.filter((t) => COMPLETED.has(t.status) && t.owner).forEach((t) => {
      const k = (t.owner ?? "").toString();
      const name = k.length > 12 ? k.slice(0, 8) + "…" : k;
      m.set(name, (m.get(name) ?? 0) + 1);
    });
    return Array.from(m.entries()).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6);
  }, [tasks]);

  // Daily productivity — last 7 days
  const productivity = useMemo(() => {
    const days: { day: string; completed: number; created: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), completed: 0, created: 0 });
      // tag
      (days as any)[days.length - 1]._key = key;
    }
    tasks.forEach((t) => {
      const k = dayKey(t.updated_at);
      const idx = days.findIndex((x: any) => x._key === k);
      if (idx >= 0) {
        days[idx].created += 1;
        if (COMPLETED.has(t.status)) days[idx].completed += 1;
      }
    });
    return days;
  }, [tasks]);

  const urgent = useMemo(
    () => tasks.filter((t) => (t.priority === "urgent" || t.priority === "high") && !COMPLETED.has(t.status))
      .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? "")).slice(0, 6),
    [tasks]
  );
  const recentPublished = useMemo(
    () => tasks.filter((t) => COMPLETED.has(t.status))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6),
    [tasks]
  );
  const lateEmployees = useMemo(() => {
    const m = new Map<string, number>();
    tasks.filter((t) => isDelayed(t) && t.owner).forEach((t) =>
      m.set((t.owner ?? "").toString(), (m.get((t.owner ?? "").toString()) ?? 0) + 1)
    );
    return Array.from(m.entries()).map(([owner, count]) => ({ owner, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6);
  }, [tasks]);

  const DEPT_COLORS = ["hsl(var(--primary))", "hsl(var(--signal-blue))", "hsl(var(--signal-amber))"];
  const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "IBM Plex Mono" };
  const tooltipStyle = {
    background: "hsl(var(--surface-elevated))",
    border: "1px solid hsl(var(--border))",
    fontSize: 12, fontFamily: "Inter",
  } as const;

  return (
    <DashboardLayout dept="Super Admin" title="Newsroom Command Center">
      <StatsGrid stats={stats.slice(0, 4)} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <StatCardInline label="Employees Active" value={String(employeeCount)} tone="green" />
        <StatCardInline label="Social Tasks" value={String(byDept.find(d=>d.dept==="Social")?.count ?? 0)} tone="muted" />
        <StatCardInline label="Website Tasks" value={String(byDept.find(d=>d.dept==="Website")?.count ?? 0)} tone="muted" />
        <StatCardInline label="Production Tasks" value={String(byDept.find(d=>d.dept==="Production")?.count ?? 0)} tone="muted" />
      </div>

      {/* Charts row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Tasks by Department">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDept}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="dept" {...axis} />
              <YAxis {...axis} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {byDept.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Completed by Employee">
          {byEmployee.length === 0 ? (
            <EmptyChart label="No completed tasks yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byEmployee} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="name" {...axis} width={70} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                <Bar dataKey="count" fill="hsl(var(--signal-green))" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Daily Productivity · 7d">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={productivity}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" {...axis} />
              <YAxis {...axis} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="created" stroke="hsl(var(--signal-blue))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completed" stroke="hsl(var(--signal-green))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <Legend items={[
            { color: "hsl(var(--signal-blue))", label: "Created" },
            { color: "hsl(var(--signal-green))", label: "Completed" },
          ]}/>
        </ChartCard>
      </section>

      {/* Tables row */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DataPanel title="Urgent Tasks" icon={AlertTriangle} accent="text-signal-red">
          {urgent.length === 0 ? <Empty label="Nothing urgent. Stay frosty." /> :
            urgent.map((t) => (
              <Row key={t.id} dept={t.dept} primary={t.title}
                meta={`${t.priority?.toUpperCase()} · ${fmt(t.deadline)}`} accent="signal-red" />
            ))}
        </DataPanel>

        <DataPanel title="Recent Published" icon={CheckCircle2} accent="text-signal-green">
          {recentPublished.length === 0 ? <Empty label="No published items yet." /> :
            recentPublished.map((t) => (
              <Row key={t.id} dept={t.dept} primary={t.title}
                meta={`Updated ${fmt(t.updated_at)}`} accent="signal-green"
                trailing={t.url ? (
                  <a href={t.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-primary hover:underline">
                    Open <ExternalLink className="size-3" />
                  </a>
                ) : null} />
            ))}
        </DataPanel>

        <DataPanel title="Late Employees" icon={Clock} accent="text-signal-amber">
          {lateEmployees.length === 0 ? <Empty label="Everyone on schedule." /> :
            lateEmployees.map((e) => (
              <div key={e.owner} className="flex items-center justify-between p-3 border-b border-border/50 last:border-b-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 grid place-items-center bg-secondary border border-border text-[10px] font-mono shrink-0">
                    <Users className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate font-mono">{e.owner}</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Late deliveries</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-1 border border-signal-red/40 text-signal-red bg-signal-red/10 tabular-nums">
                  {e.count}
                </span>
              </div>
            ))}
        </DataPanel>
      </section>

      {loading && (
        <div className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground animate-pulse">
          Syncing all desks…
        </div>
      )}
    </DashboardLayout>
  );
};

const fmt = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const StatCardInline = ({ label, value, tone }: { label: string; value: string; tone: "green"|"red"|"amber"|"muted" }) => (
  <div className="bg-surface p-5">
    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
    <span className={cn("text-2xl font-light tabular-nums tracking-tight",
      tone === "green" && "text-signal-green",
      tone === "amber" && "text-signal-amber",
      tone === "red" && "text-signal-red",
    )}>{value}</span>
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-border bg-surface/40 p-4 space-y-3">
    <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
    {children}
  </div>
);

const Legend = ({ items }: { items: { color: string; label: string }[] }) => (
  <div className="flex gap-4 mt-2">
    {items.map((i) => (
      <span key={i.label} className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span className="size-2" style={{ background: i.color }} /> {i.label}
      </span>
    ))}
  </div>
);

const EmptyChart = ({ label }: { label: string }) => (
  <div className="h-[220px] grid place-items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
    {label}
  </div>
);

const DataPanel = ({ title, icon: Icon, accent, children }: any) => (
  <div className="border border-border bg-surface/40 flex flex-col">
    <div className="p-3 border-b border-border flex items-center gap-2">
      <Icon className={cn("size-3.5", accent)} />
      <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold">{title}</h3>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const Empty = ({ label }: { label: string }) => (
  <div className="p-8 text-center text-xs text-muted-foreground">{label}</div>
);

const DEPT_TONE: Record<string, string> = {
  Social: "border-primary/40 text-primary",
  Website: "border-[hsl(var(--signal-blue))]/40 text-signal-blue",
  Production: "border-signal-amber/40 text-signal-amber",
};

const Row = ({ dept, primary, meta, accent, trailing }: {
  dept: "Social" | "Website" | "Production"; primary: string; meta: string;
  accent: "signal-red" | "signal-green" | "signal-amber"; trailing?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 p-3 border-b border-border/50 last:border-b-0 hover:bg-secondary/40 transition-colors">
    <span className={cn("text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border", DEPT_TONE[dept])}>
      {dept}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{primary}</p>
      <p className={cn("text-[10px] font-mono uppercase tracking-widest mt-0.5",
        accent === "signal-red" && "text-signal-red",
        accent === "signal-green" && "text-signal-green",
        accent === "signal-amber" && "text-signal-amber",
      )}>{meta}</p>
    </div>
    {trailing}
  </div>
);

export default AdminDashboard;
