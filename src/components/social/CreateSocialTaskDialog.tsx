import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export type SocialTaskType = "post" | "poster" | "reel" | "breaking";
export type SocialPlatform = "facebook" | "youtube" | "instagram" | "tiktok" | "x";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

const TYPE_LABELS: Record<SocialTaskType, string> = {
  post: "Post Task", poster: "Poster Task", reel: "Reel Task", breaking: "Breaking News Task",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialType: SocialTaskType;
  onCreated?: () => void;
}

export const CreateSocialTaskDialog = ({ open, onOpenChange, initialType, onCreated }: Props) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<SocialTaskType>(initialType);
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [assetPage, setAssetPage] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [notes, setNotes] = useState("");

  useEffect(() => { if (open) setTaskType(initialType); }, [open, initialType]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("social_tasks").insert({
      title, task_type: taskType, platform,
      asset_page: assetPage || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      priority, notes: notes || null,
      created_by: user?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Task dispatched");
    setTitle(""); setAssetPage(""); setDeadline(""); setNotes("");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            New Dispatch / {TYPE_LABELS[taskType]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Type</Label>
              <select value={taskType} onChange={(e) => setTaskType(e.target.value as SocialTaskType)}
                className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm">
                <option value="post">Post</option><option value="poster">Poster</option>
                <option value="reel">Reel</option><option value="breaking">Breaking</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Platform</Label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm">
                <option value="facebook">Facebook</option><option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option><option value="tiktok">TikTok</option>
                <option value="x">X (Twitter)</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Asset / Page</Label>
            <Input value={assetPage} onChange={(e) => setAssetPage(e.target.value)} placeholder="e.g. ABN News Main Page" className="bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Deadline</Label>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Priority</Label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm">
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="bg-background" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy} className="font-mono uppercase tracking-widest text-xs">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Dispatch →"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
