import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, AppRole, roleHomePath } from "@/context/AuthContext";
import {
  LayoutDashboard, ListChecks, PlusSquare, Building2, FolderKanban,
  Users, BarChart3, Bell, Settings, LogOut, Menu, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { label: string; path: string; icon: LucideIcon; allow: AppRole[] | "all" };

const NAV: NavItem[] = [
  { label: "Dashboard",     path: "__home",         icon: LayoutDashboard, allow: "all" },
  { label: "Tasks",         path: "/tasks",         icon: ListChecks,      allow: ["social_media", "website", "production"] },
  { label: "Create Task",   path: "/tasks/new",     icon: PlusSquare,      allow: ["social_media", "website", "production"] },
  { label: "Departments",   path: "/departments",   icon: Building2,       allow: [] },
  { label: "Assets",        path: "/assets",        icon: FolderKanban,    allow: ["social_media", "website", "production"] },
  { label: "Users",         path: "/users",         icon: Users,           allow: [] },
  { label: "Reports",       path: "/reports",       icon: BarChart3,       allow: ["website"] },
  { label: "Notifications", path: "/notifications", icon: Bell,            allow: "all" },
  { label: "Settings",      path: "/settings",      icon: Settings,        allow: "all" },
];

export const DashboardLayout = ({ children, title, dept }: { children: ReactNode; title: string; dept: string }) => {
  const { role, user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const homePath = roleHomePath(role);
  const isAllowed = (n: NavItem) =>
    role === "super_admin" || n.allow === "all" ||
    (Array.isArray(n.allow) && role !== null && n.allow.includes(role));

  const visible = NAV.filter(isAllowed).map((n) => ({
    ...n,
    path: n.path === "__home" ? homePath : n.path,
  }));

  const initials = (user?.email ?? "OP").slice(0, 2).toUpperCase();
  const now = new Date().toUTCString().split(" ")[4];

  const SidebarBody = (
    <>
      <div className="p-5 border-b border-sidebar-border flex items-center gap-3">
        <div className="size-8 bg-primary grid place-items-center font-mono font-bold text-primary-foreground text-sm">A</div>
        <div className="leading-none">
          <div className="text-xs font-bold tracking-tight">AUSAF DIGITAL</div>
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em] mt-1">Mgmt v1.0</div>
        </div>
      </div>

      <nav className="flex-1 p-3 mt-2 overflow-y-auto">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 px-2">Workspace</p>
        <ul className="space-y-0.5">
          {visible.map((n) => {
            const active = location.pathname === n.path;
            return (
              <li key={n.label}>
                <Link to={n.path} onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors border-l-2 rounded-sm",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-primary"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50 border-transparent"
                  )}>
                  <n.icon className="size-4 shrink-0" />
                  <span className="truncate">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {role === "super_admin" && (
          <div className="mt-5 px-2">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-primary border border-primary/40 px-2 py-1 rounded-sm">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Full Clearance
            </span>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border bg-surface/40">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-secondary grid place-items-center text-[10px] font-mono border border-border">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{user?.email}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">{role?.replace("_", " ")}</p>
          </div>
          <Button onClick={signOut} variant="ghost" size="icon" className="h-8 w-8" title="Sign out">
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 border-r border-border bg-sidebar flex-col shrink-0">
        {SidebarBody}
      </aside>

      {/* Mobile/tablet drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-sidebar-border flex flex-col">
          {SidebarBody}
        </SheetContent>
      </Sheet>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 lg:h-16 border-b border-border flex items-center justify-between px-3 sm:px-5 lg:px-8 gap-2 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 shrink-0" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <nav className="text-xs font-mono text-muted-foreground space-x-2 truncate">
              <span className="hidden sm:inline">ROOT</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-foreground">{dept.toUpperCase()}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary uppercase tracking-tighter">Live Broadcast Mode</span>
            </div>
            <div className="hidden lg:block h-8 w-px bg-border" />
            <div className="hidden lg:block text-xs font-mono text-muted-foreground tabular-nums">UTC {now}</div>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{dept}</p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};
