import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Users, UserPlus, Pencil, KeyRound, Power, FolderKanban, Shield, Search, Loader2,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

type Status = "active" | "disabled";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  department: string | null;
  status: Status;
  allowed_assets: string[];
  last_active: string | null;
  role: AppRole | null;
  created_at: string;
}

const ROLES: { value: AppRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "social_media", label: "Social Media" },
  { value: "website", label: "Website" },
  { value: "production", label: "Production" },
];

const UsersPage = () => {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [assetsFor, setAssetsFor] = useState<UserRow | null>(null);
  const [roleFor, setRoleFor] = useState<UserRow | null>(null);
  const [confirmDisable, setConfirmDisable] = useState<UserRow | null>(null);
  const [confirmReset, setConfirmReset] = useState<UserRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as UserRow[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterRole !== "all" && r.role !== filterRole) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (!needle) return true;
      return (
        (r.full_name ?? "").toLowerCase().includes(needle) ||
        (r.email ?? "").toLowerCase().includes(needle) ||
        (r.department ?? "").toLowerCase().includes(needle) ||
        (r.username ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, filterRole, filterStatus]);

  const counts = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    disabled: rows.filter((r) => r.status === "disabled").length,
    admins: rows.filter((r) => r.role === "super_admin").length,
  }), [rows]);

  return (
    <DashboardLayout dept="Super Admin" title="User Management">
      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <Stat label="Total Users" value={counts.total} icon={Users} />
        <Stat label="Active" value={counts.active} icon={Power} tone="green" />
        <Stat label="Disabled" value={counts.disabled} icon={Power} tone="red" />
        <Stat label="Super Admins" value={counts.admins} icon={Shield} tone="primary" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name, email, department…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4 mr-2" /> Create User
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border bg-surface/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Name</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Department</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Role</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Status</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Allowed Assets</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Last Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-mono uppercase tracking-widest">
                <Loader2 className="size-4 animate-spin inline mr-2" /> Loading roster…
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                No users match these filters.
              </TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id} className={cn(r.status === "disabled" && "opacity-60")}>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 grid place-items-center bg-secondary border border-border text-[10px] font-mono shrink-0">
                      {(r.full_name ?? r.email ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.full_name ?? r.username ?? "—"}
                        {r.id === me?.id && <span className="ml-2 text-[9px] font-mono uppercase tracking-widest text-primary">(you)</span>}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">{r.email ?? "—"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{r.department ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>{r.role ? <RoleBadge role={r.role} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[9px] font-mono uppercase tracking-widest",
                    r.status === "active" ? "bg-signal-green/10 text-signal-green border-signal-green/40"
                                          : "bg-signal-red/10 text-signal-red border-signal-red/40",
                  )} variant="outline">
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.allowed_assets.length === 0 ? (
                    <span className="text-muted-foreground text-xs">All / none specified</span>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                      {r.allowed_assets.slice(0, 3).map((a) => (
                        <span key={a} className="text-[10px] font-mono px-1.5 py-0.5 border border-border bg-secondary">
                          {a}
                        </span>
                      ))}
                      {r.allowed_assets.length > 3 && (
                        <span className="text-[10px] font-mono text-muted-foreground">+{r.allowed_assets.length - 3}</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {r.last_active ? formatDistanceToNow(new Date(r.last_active), { addSuffix: true }) : "Never"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest">Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setEditing(r)}>
                        <Pencil className="size-3.5 mr-2" /> Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRoleFor(r)}>
                        <Shield className="size-3.5 mr-2" /> Assign Role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssetsFor(r)}>
                        <FolderKanban className="size-3.5 mr-2" /> Assign Assets
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setConfirmReset(r)}>
                        <KeyRound className="size-3.5 mr-2" /> Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setConfirmDisable(r)}
                        disabled={r.id === me?.id}
                        className="text-signal-red"
                      >
                        <Power className="size-3.5 mr-2" />
                        {r.status === "active" ? "Disable User" : "Re-enable User"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* === Dialogs === */}
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
      <EditUserDialog user={editing} onOpenChange={(o) => !o && setEditing(null)} onSaved={load} />
      <AssetsDialog user={assetsFor} onOpenChange={(o) => !o && setAssetsFor(null)} onSaved={load} />
      <RoleDialog user={roleFor} onOpenChange={(o) => !o && setRoleFor(null)} onSaved={load} />

      <AlertDialog open={!!confirmDisable} onOpenChange={(o) => !o && setConfirmDisable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDisable?.status === "active" ? "Disable this user?" : "Re-enable this user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDisable?.status === "active"
                ? `${confirmDisable?.full_name ?? confirmDisable?.email} will be marked disabled. They keep their data, but you should remove their role to fully block sign-in.`
                : `${confirmDisable?.full_name ?? confirmDisable?.email} will be re-enabled.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmDisable) return;
              const next: Status = confirmDisable.status === "active" ? "disabled" : "active";
              const { error } = await supabase.rpc("admin_set_user_status", {
                _user_id: confirmDisable.id, _status: next,
              });
              if (error) toast.error(error.message);
              else toast.success(next === "disabled" ? "User disabled" : "User re-enabled");
              setConfirmDisable(null);
              load();
            }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmReset} onOpenChange={(o) => !o && setConfirmReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send password reset?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll email a password reset link to <strong>{confirmReset?.email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmReset?.email) return;
              const { data, error } = await supabase.functions.invoke("admin-user-manage", {
                body: { action: "reset", email: confirmReset.email,
                  redirect_to: `${window.location.origin}/reset-password` },
              });
              if (error || (data as any)?.error) toast.error(error?.message ?? (data as any).error);
              else toast.success("Reset email sent");
              setConfirmReset(null);
            }}>Send Reset Email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

// ===== Sub-components =====

const Stat = ({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone?: "green"|"red"|"primary" }) => (
  <div className="bg-surface p-5">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={cn("size-3.5",
        tone === "green" && "text-signal-green",
        tone === "red" && "text-signal-red",
        tone === "primary" && "text-primary",
        !tone && "text-muted-foreground",
      )} />
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
    <span className={cn("text-2xl font-light tabular-nums tracking-tight",
      tone === "green" && "text-signal-green",
      tone === "red" && "text-signal-red",
      tone === "primary" && "text-primary",
    )}>{value}</span>
  </div>
);

const RoleBadge = ({ role }: { role: AppRole }) => {
  const map: Record<AppRole, string> = {
    super_admin: "bg-primary/10 text-primary border-primary/40",
    social_media: "bg-signal-amber/10 text-signal-amber border-signal-amber/40",
    website: "bg-[hsl(var(--signal-blue))]/10 text-signal-blue border-[hsl(var(--signal-blue))]/40",
    production: "bg-signal-green/10 text-signal-green border-signal-green/40",
  };
  return (
    <Badge variant="outline" className={cn("text-[9px] font-mono uppercase tracking-widest", map[role])}>
      {role.replace("_", " ")}
    </Badge>
  );
};

// ---- Create user ----
const CreateUserDialog = ({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", username: "",
    department: "", role: "social_media" as AppRole,
  });

  const reset = () => setForm({ email: "", password: "", full_name: "", username: "", department: "", role: "social_media" });

  const submit = async () => {
    if (!form.email.includes("@")) { toast.error("Valid email required"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-user-manage", {
      body: { action: "create", ...form },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error(error?.message ?? (data as any).error);
      return;
    }
    toast.success("User created");
    reset();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Full name">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={120} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
            </Field>
            <Field label="Username">
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} maxLength={60} />
            </Field>
          </div>
          <Field label="Temporary password">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} maxLength={72} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Newsroom" maxLength={60} />
            </Field>
            <Field label="Role">
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <UserPlus className="size-3.5 mr-2" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---- Edit user ----
const EditUserDialog = ({ user, onOpenChange, onSaved }: {
  user: UserRow | null; onOpenChange: (o: boolean) => void; onSaved: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", username: "", department: "" });
  useEffect(() => {
    if (user) setForm({
      full_name: user.full_name ?? "",
      username: user.username ?? "",
      department: user.department ?? "",
    });
  }, [user]);
  if (!user) return null;
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Full name">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={120} />
          </Field>
          <Field label="Username">
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} maxLength={60} />
          </Field>
          <Field label="Department">
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} maxLength={60} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy} onClick={async () => {
            setBusy(true);
            const { error } = await supabase.from("profiles").update({
              full_name: form.full_name || null,
              username: form.username || null,
              department: form.department || null,
            }).eq("id", user.id);
            setBusy(false);
            if (error) toast.error(error.message);
            else { toast.success("User updated"); onOpenChange(false); onSaved(); }
          }}>
            {busy ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <Pencil className="size-3.5 mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---- Assign role ----
const RoleDialog = ({ user, onOpenChange, onSaved }: {
  user: UserRow | null; onOpenChange: (o: boolean) => void; onSaved: () => void;
}) => {
  const [role, setRole] = useState<AppRole>("social_media");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user?.role) setRole(user.role); }, [user]);
  if (!user) return null;
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign Role</DialogTitle></DialogHeader>
        <Field label={`Role for ${user.full_name ?? user.email}`}>
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy} onClick={async () => {
            setBusy(true);
            const { error } = await supabase.rpc("admin_set_user_role", {
              _user_id: user.id, _role: role,
            });
            setBusy(false);
            if (error) toast.error(error.message);
            else { toast.success("Role updated"); onOpenChange(false); onSaved(); }
          }}>
            {busy ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <Shield className="size-3.5 mr-2" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---- Assign allowed assets ----
const AssetsDialog = ({ user, onOpenChange, onSaved }: {
  user: UserRow | null; onOpenChange: (o: boolean) => void; onSaved: () => void;
}) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) setText((user.allowed_assets ?? []).join(", ")); }, [user]);
  if (!user) return null;

  const list = text.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign Allowed Assets</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Pages, channels, or assets (comma-separated)">
            <Input value={text} onChange={(e) => setText(e.target.value.slice(0, 1000))}
              placeholder="e.g. @ausaftv, @ausafnews_yt, breaking-desk" />
          </Field>
          {list.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {list.map((a) => (
                <span key={a} className="text-[10px] font-mono px-2 py-1 border border-border bg-secondary">
                  {a}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            Empty list = no asset restriction
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy} onClick={async () => {
            setBusy(true);
            const { error } = await supabase.from("profiles").update({
              allowed_assets: list,
            }).eq("id", user.id);
            setBusy(false);
            if (error) toast.error(error.message);
            else { toast.success("Assets updated"); onOpenChange(false); onSaved(); }
          }}>
            {busy ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <FolderKanban className="size-3.5 mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default UsersPage;
