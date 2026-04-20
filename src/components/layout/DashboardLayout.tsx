import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/context/AuthContext";
import {
  LayoutDashboard, Share2, Globe, Clapperboard, ShieldCheck, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const allNav: { label: string; path: string; icon: any; role: AppRole }[] = [
  { label: "Social Media", path: "/social", icon: Share2, role: "social_media" },
  { label: "Website", path: "/website", icon: Globe, role: "website" },
  { label: "Digital Production", path: "/production", icon: Clapperboard, role: "production" },
  { label: "Super Admin", path: "/admin", icon: ShieldCheck, role: "super_admin" },
];

export const DashboardLayout = ({ children, title, dept }: { children: ReactNode; title: string; dept: string }) => {
  const { role, user, signOut } = useAuth();
  const location = useLocation();

  const visibleNav = role === "super_admin" ? allNav : allNav.filter((n) => n.role === role);

  const initials = (user?.email ?? "OP").slice(0, 2).toUpperCase();
  const now = new Date().toUTCString().split(" ")[4];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="p-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="size-8 bg-primary grid place-items-center font-mono font-bold text-primary-foreground text-sm">A</div>
          <div className="leading-none">
            <div className="text-xs font-bold tracking-tight">AUSAF DIGITAL</div>
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em] mt-1">Mgmt v1.0</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 mt-2">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3 px-2">Operations</p>
            <Link to={location.pathname}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary">
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
          </div>

          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3 px-2">Departments</p>
            <ul className="space-y-1">
              {visibleNav.map((n) => {
                const active = location.pathname === n.path;
                return (
                  <li key={n.path}>
                    <Link to={n.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                          : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50 border-l-2 border-transparent"
                      )}>
                      <n.icon className="size-4" /> {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
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
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <nav className="text-xs font-mono text-muted-foreground space-x-2">
            <span>ROOT</span><span>/</span>
            <span className="text-foreground">{dept.toUpperCase()}</span>
          </nav>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary uppercase tracking-tighter">Live Broadcast Mode</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div className="hidden sm:block text-xs font-mono text-muted-foreground tabular-nums">UTC {now}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{dept}</p>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};
