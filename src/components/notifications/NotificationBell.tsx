import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Bell, CheckCheck, Trash2, UserPlus, Clock, AlertTriangle, XCircle, CheckCircle2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications, NotificationType, AppNotification } from "@/context/NotificationsContext";

const TYPE_META: Record<NotificationType, { icon: any; tone: string; label: string }> = {
  new_task_assigned: { icon: UserPlus,     tone: "text-primary",       label: "Assigned" },
  deadline_near:     { icon: Clock,        tone: "text-signal-amber",  label: "Deadline" },
  overdue_task:      { icon: AlertTriangle,tone: "text-signal-red",    label: "Overdue" },
  task_rejected:     { icon: XCircle,      tone: "text-signal-red",    label: "Rejected" },
  task_published:    { icon: CheckCircle2, tone: "text-signal-green",  label: "Published" },
};

export const NotificationBell = () => {
  const { items, unread, markAllRead, markRead, remove } = useNotifications();
  const navigate = useNavigate();

  const onClick = async (n: AppNotification) => {
    if (!n.read) await markRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label={`${unread} unread notifications`}>
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-signal-red text-white text-[9px] font-mono font-bold grid place-items-center ring-2 ring-background">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 bg-popover">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {unread} unread · {items.length} total
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unread === 0}
            className="h-7 text-[10px] font-mono uppercase tracking-widest">
            <CheckCheck className="size-3 mr-1.5" /> Mark all read
          </Button>
        </div>

        <ScrollArea className="h-96">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="size-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                You're all caught up
              </p>
            </div>
          ) : items.map((n) => {
            const meta = TYPE_META[n.type];
            const Icon = meta.icon;
            return (
              <div key={n.id}
                className={cn(
                  "group flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 cursor-pointer hover:bg-secondary/40 transition-colors",
                  !n.read && "bg-primary/5",
                )}
                onClick={() => onClick(n)}>
                <div className={cn("size-8 grid place-items-center bg-secondary border border-border shrink-0", meta.tone)}>
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate flex-1">{n.title}</p>
                    {!n.read && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
                    {meta.label} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); remove(n.id); }} aria-label="Dismiss">
                  <Trash2 className="size-3" />
                </Button>
              </div>
            );
          })}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
