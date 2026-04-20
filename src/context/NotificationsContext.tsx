import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export type NotificationType =
  | "new_task_assigned" | "deadline_near" | "overdue_task"
  | "task_rejected" | "task_published";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  task_dept: "social" | "website" | "production" | null;
  task_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

interface Ctx {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const C = createContext<Ctx>({
  items: [], unread: 0, loading: true,
  markAllRead: async () => {}, markRead: async () => {}, remove: async () => {}, refresh: async () => {},
});

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("notifications").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    setItems((data ?? []) as AppNotification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as AppNotification;
          setItems((prev) => [n, ...prev].slice(0, 50));
          toast(n.title, { description: n.body ?? undefined });
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as AppNotification;
          setItems((prev) => prev.map((p) => p.id === n.id ? n : p));
        })
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    setItems((p) => p.map((n) => n.read ? n : { ...n, read: true, read_at: new Date().toISOString() }));
    await supabase.rpc("mark_all_notifications_read");
  };
  const markRead = async (id: string) => {
    setItems((p) => p.map((n) => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n));
    await supabase.from("notifications").update({ read: true, read_at: new Date().toISOString() }).eq("id", id);
  };
  const remove = async (id: string) => {
    setItems((p) => p.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <C.Provider value={{ items, unread, loading, markAllRead, markRead, remove, refresh }}>
      {children}
    </C.Provider>
  );
};

export const useNotifications = () => useContext(C);
