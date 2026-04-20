import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export type ProductionStage =
  | "idea_received" | "researching" | "shooting" | "voice_over"
  | "editing" | "ready" | "scheduled" | "published";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export const CreateProductionTaskDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [reporter, setReporter] = useState("");
  const [editor, setEditor] = useState("");
  const [producer, setProducer] = useState("");
  const [deadline, setDeadline] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("production_tasks").insert({
      title,
      source: source || null,
      reporter: reporter || null,
      editor: editor || null,
      producer: producer || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      target_platform: targetPlatform || null,
      notes: notes || null,
      created_by: user?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Production task created");
    setTitle(""); setSource(""); setReporter(""); setEditor(""); setProducer("");
    setDeadline(""); setTargetPlatform(""); setNotes("");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            New Production Task
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Source</Label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Wire, in-house…" className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Target Platform</Label>
              <Input value={targetPlatform} onChange={(e) => setTargetPlatform(e.target.value)} placeholder="YouTube, TV, Reels…" className="bg-background" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Reporter</Label>
              <Input value={reporter} onChange={(e) => setReporter(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Editor</Label>
              <Input value={editor} onChange={(e) => setEditor(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Producer</Label>
              <Input value={producer} onChange={(e) => setProducer(e.target.value)} className="bg-background" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Deadline</Label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="bg-background" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy} className="font-mono uppercase tracking-widest text-xs">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Create →"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
