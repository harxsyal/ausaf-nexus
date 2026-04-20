import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, Pencil, Trash2, Power, Users as UsersIcon, FolderKanban, Search,
  Loader2, MoreHorizontal, Building2, Globe2,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Status = "active" | "inactive";

interface Asset {
  id: string;
  name: string;
  brand: string | null;
  platform: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_user_ids: string[];
}

interface UserOption {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  role: AppRole | null;
}

const PLATFORM_PRESETS = [
  "Facebook", "YouTube", "Instagram", "TikTok", "X", "WhatsApp",
  "Web", "Print", "Podcast", "TV",
];
const BRAND_PRESETS = ["ABN News", "Daily Ausaf", "Ausaf Digital", "Ausaf Life", "Regional"];

const AssetsPage = () => {
  const { role } = useAuth();
  const isAdmin = role === "super_admin";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");

  const [editing, setEditing] = useState<Asset | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<Asset | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Asset | null>(null);

  const load = async () => {
    setLoading(true);
    const [a, au, u] = await Promise.all([
      supabase.from("assets").select("*").order("name"),
      supabase.from("asset_users").select("asset_id,user_id"),
      isAdmin
        ? supabase.rpc("admin_list_users")
        : supabase.from("profiles").select("id, full_name, username").order("full_name"),
    ]);
    setLoading(false);
    if (a.error) { toast.error(a.error.message); return; }

    const map = new Map<string, string[]>();
    (au.data ?? []).forEach((r: any) => {
      map.set(r.asset_id, [...(map.get(r.asset_id) ?? []), r.user_id]);
    });
    setAssets((a.data ?? []).map((row: any) => ({
      ...row, assigned_user_ids: map.get(row.id) ?? [],
    })));

    if (isAdmin) {
      setUsers(((u.data ?? []) as any[]).map((r) => ({
        id: r.id, full_name: r.full_name, username: r.username,
        email: r.email, role: r.role,
      })));
    } else {
      setUsers(((u.data ?? []) as any[]).map((r) => ({
        id: r.id, full_name: r.full_name, username: r.username, email: null, role: null,
      })));
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [isAdmin]);

  const userById = useMemo(() => {
    const m = new Map<string, UserOption>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => a.platform && set.add(a.platform));
    return Array.from(set).sort();
  }, [assets]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => a.brand && set.add(a.brand));
    return Array.from(set).sort();
  }, [assets]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return assets.filter((a) => {
      if (filterPlatform !== "all" && a.platform !== filterPlatform) return false;
      if (filterBrand !== "all" && a.brand !== filterBrand) return false;
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (!needle) return true;
      return (
        a.name.toLowerCase().includes(needle) ||
        (a.brand ?? "").toLowerCase().includes(needle) ||
        (a.platform ?? "").toLowerCase().includes(needle)
      );
    });
  }, [assets, q, filterPlatform, filterBrand, filterStatus]);

  const counts = useMemo(() => ({
    total: assets.length,
    active: assets.filter((a) => a.status === "active").length,
    inactive: assets.filter((a) => a.status === "inactive").length,
    brands: new Set(assets.map((a) => a.brand).filter(Boolean)).size,
  }), [assets]);

  const toggleStatus = async (a: Asset) => {
    const next: Status = a.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("assets").update({ status: next }).eq("id", a.id);
    if (error) toast.error(error.message);
    else { toast.success(next === "active" ? "Asset activated" : "Asset archived"); load(); }
  };

  return (
    <DashboardLayout dept={isAdmin ? "Super Admin" : "Workspace"} title="Asset Management">
      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <Stat label="Total Assets" value={counts.total} icon={FolderKanban} />
        <Stat label="Active" value={counts.active} icon={Power} tone="green" />
        <Stat label="Inactive" value={counts.inactive} icon={Power} tone="red" />
        <Stat label="Brands" value={counts.brands} icon={Building2} tone="primary" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input placeholder="Search assets, brand, platform…"
              value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Brand" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-2" /> New Asset
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border bg-surface/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Asset Name</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Brand</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Platform</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Status</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Assigned Users</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-widest">Updated</TableHead>
              {isAdmin && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-muted-foreground text-xs font-mono uppercase tracking-widest">
                <Loader2 className="size-4 animate-spin inline mr-2" /> Loading assets…
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-muted-foreground text-sm">
                {assets.length === 0 ? "No assets yet. Seed your portfolio to get started." : "No assets match these filters."}
              </TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow key={a.id} className={cn(a.status === "inactive" && "opacity-60")}>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 grid place-items-center bg-secondary border border-border shrink-0">
                      <PlatformIcon platform={a.platform} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      {a.notes && <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[280px]">{a.notes}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{a.brand ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  {a.platform ? (
                    <Badge variant="outline" className="text-[9px] font-mono uppercase tracking-widest">{a.platform}</Badge>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-mono uppercase tracking-widest",
                    a.status === "active"
                      ? "bg-signal-green/10 text-signal-green border-signal-green/40"
                      : "bg-signal-red/10 text-signal-red border-signal-red/40",
                  )}>{a.status}</Badge>
                </TableCell>
                <TableCell>
                  {a.assigned_user_ids.length === 0 ? (
                    <span className="text-muted-foreground text-xs">Unassigned</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        {a.assigned_user_ids.slice(0, 4).map((uid) => {
                          const u = userById.get(uid);
                          const label = u?.full_name ?? u?.username ?? "?";
                          return (
                            <div key={uid}
                              title={label}
                              className="size-7 grid place-items-center bg-secondary border border-background ring-1 ring-border text-[9px] font-mono">
                              {label.slice(0, 2).toUpperCase()}
                            </div>
                          );
                        })}
                      </div>
                      {a.assigned_user_ids.length > 4 && (
                        <span className="text-[10px] font-mono text-muted-foreground ml-1">
                          +{a.assigned_user_ids.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditing(a)}>
                          <Pencil className="size-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAssignFor(a)}>
                          <UsersIcon className="size-3.5 mr-2" /> Assign Users
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(a)}>
                          <Power className="size-3.5 mr-2" />
                          {a.status === "active" ? "Archive" : "Reactivate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setConfirmDelete(a)} className="text-signal-red">
                          <Trash2 className="size-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* === Dialogs === */}
      <AssetDialog
        open={createOpen || !!editing}
        asset={editing}
        onOpenChange={(o) => { if (!o) { setEditing(null); setCreateOpen(false); } }}
        onSaved={load}
      />
      <AssignUsersDialog
        asset={assignFor}
        users={users}
        onOpenChange={(o) => { if (!o) setAssignFor(null); }}
        onSaved={load}
      />
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmDelete?.name}</strong> will be permanently removed along with all its user assignments.
              Existing tasks that reference it by name will keep working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmDelete) return;
              const { error } = await supabase.from("assets").delete().eq("id", confirmDelete.id);
              if (error) toast.error(error.message);
              else toast.success("Asset deleted");
              setConfirmDelete(null);
              load();
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

// ===== Sub-components =====

const Stat = ({ label, value, icon: Icon, tone }: {
  label: string; value: number; icon: any; tone?: "green"|"red"|"primary";
}) => (
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

const PlatformIcon = ({ platform }: { platform: string | null }) => {
  if (!platform) return <FolderKanban className="size-3.5 text-muted-foreground" />;
  if (/web/i.test(platform)) return <Globe2 className="size-3.5 text-muted-foreground" />;
  return <FolderKanban className="size-3.5 text-muted-foreground" />;
};

const AssetDialog = ({ open, asset, onOpenChange, onSaved }: {
  open: boolean; asset: Asset | null; onOpenChange: (o: boolean) => void; onSaved: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", brand: "", platform: "", status: "active" as Status, notes: "",
  });

  useEffect(() => {
    if (asset) setForm({
      name: asset.name, brand: asset.brand ?? "", platform: asset.platform ?? "",
      status: asset.status, notes: asset.notes ?? "",
    });
    else setForm({ name: "", brand: "", platform: "", status: "active", notes: "" });
  }, [asset, open]);

  const submit = async () => {
    const name = form.name.trim();
    if (name.length < 2) { toast.error("Asset name is required"); return; }
    if (name.length > 120) { toast.error("Asset name too long"); return; }
    setBusy(true);
    const payload = {
      name,
      brand: form.brand.trim() || null,
      platform: form.platform.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
    };
    const res = asset
      ? await supabase.from("assets").update(payload).eq("id", asset.id)
      : await supabase.from("assets").insert(payload);
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(asset ? "Asset updated" : "Asset created");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{asset ? "Edit Asset" : "New Asset"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Asset Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. ABN News Facebook" maxLength={120} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <Input list="brand-suggestions" value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. ABN News" maxLength={60} />
              <datalist id="brand-suggestions">
                {BRAND_PRESETS.map((b) => <option key={b} value={b} />)}
              </datalist>
            </Field>
            <Field label="Platform">
              <Input list="platform-suggestions" value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                placeholder="e.g. Facebook" maxLength={60} />
              <datalist id="platform-suggestions">
                {PLATFORM_PRESETS.map((p) => <option key={p} value={p} />)}
              </datalist>
            </Field>
          </div>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value.slice(0, 1000) })}
              placeholder="Internal description, account handle, region…" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy} onClick={submit}>
            {busy ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : (asset ? <Pencil className="size-3.5 mr-2" /> : <Plus className="size-3.5 mr-2" />)}
            {asset ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AssignUsersDialog = ({ asset, users, onOpenChange, onSaved }: {
  asset: Asset | null; users: UserOption[]; onOpenChange: (o: boolean) => void; onSaved: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (asset) setPicked(new Set(asset.assigned_user_ids));
    setFilter("");
  }, [asset]);

  if (!asset) return null;

  const filtered = users.filter((u) => {
    if (!filter.trim()) return true;
    const n = filter.toLowerCase();
    return (
      (u.full_name ?? "").toLowerCase().includes(n) ||
      (u.username ?? "").toLowerCase().includes(n) ||
      (u.email ?? "").toLowerCase().includes(n) ||
      (u.role ?? "").toLowerCase().includes(n)
    );
  });

  const toggle = (id: string) => {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    setPicked(next);
  };

  const submit = async () => {
    setBusy(true);
    const wanted = picked;
    const current = new Set(asset.assigned_user_ids);
    const toAdd = Array.from(wanted).filter((id) => !current.has(id));
    const toRemove = Array.from(current).filter((id) => !wanted.has(id));

    if (toRemove.length) {
      const { error } = await supabase.from("asset_users").delete()
        .eq("asset_id", asset.id).in("user_id", toRemove);
      if (error) { setBusy(false); toast.error(error.message); return; }
    }
    if (toAdd.length) {
      const { error } = await supabase.from("asset_users").insert(
        toAdd.map((uid) => ({ asset_id: asset.id, user_id: uid })),
      );
      if (error) { setBusy(false); toast.error(error.message); return; }
    }
    setBusy(false);
    toast.success("Assignments updated");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={!!asset} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Users — {asset.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter users…" className="pl-9" />
          </div>
          <ScrollArea className="h-72 border border-border">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No users match.</p>
            ) : filtered.map((u) => {
              const label = u.full_name ?? u.username ?? u.email ?? "Unknown";
              return (
                <label key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 last:border-b-0 cursor-pointer hover:bg-secondary/40">
                  <Checkbox checked={picked.has(u.id)} onCheckedChange={() => toggle(u.id)} />
                  <div className="size-7 grid place-items-center bg-secondary border border-border text-[9px] font-mono shrink-0">
                    {label.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {u.email ?? u.username ?? "—"}
                    </p>
                  </div>
                  {u.role && (
                    <Badge variant="outline" className="text-[9px] font-mono uppercase tracking-widest">
                      {u.role.replace("_", " ")}
                    </Badge>
                  )}
                </label>
              );
            })}
          </ScrollArea>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {picked.size} selected
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy} onClick={submit}>
            {busy ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <UsersIcon className="size-3.5 mr-2" />}
            Save Assignments
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

export default AssetsPage;
