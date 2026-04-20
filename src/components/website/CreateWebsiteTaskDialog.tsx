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

export type WebArticleType = "news" | "original" | "postcard";
export type WebLanguage = "urdu" | "english" | "other";

const TYPE_LABELS: Record<WebArticleType, string> = {
  news: "News Article", original: "Original Article", postcard: "Web Postcard",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialType: WebArticleType;
  onCreated?: () => void;
}

export const CreateWebsiteTaskDialog = ({ open, onOpenChange, initialType, onCreated }: Props) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [headline, setHeadline] = useState("");
  const [articleType, setArticleType] = useState<WebArticleType>(initialType);
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState<WebLanguage>("urdu");
  const [writer, setWriter] = useState("");
  const [editor, setEditor] = useState("");
  const [deadline, setDeadline] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { if (open) setArticleType(initialType); }, [open, initialType]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("website_tasks").insert({
      headline, article_type: articleType,
      category: category || null, language,
      writer: writer || null, editor: editor || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      url: url || null, notes: notes || null,
      created_by: user?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Article task dispatched");
    setHeadline(""); setCategory(""); setWriter(""); setEditor(""); setDeadline(""); setUrl(""); setNotes("");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            New Article / {TYPE_LABELS[articleType]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Headline</Label>
            <Input required value={headline} onChange={(e) => setHeadline(e.target.value)} className="bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Type</Label>
              <select value={articleType} onChange={(e) => setArticleType(e.target.value as WebArticleType)}
                className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm">
                <option value="news">News</option>
                <option value="original">Original</option>
                <option value="postcard">Postcard</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Language</Label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as WebLanguage)}
                className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm">
                <option value="urdu">Urdu</option>
                <option value="english">English</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Politics, Sports, Tech…" className="bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Writer</Label>
              <Input value={writer} onChange={(e) => setWriter(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Editor</Label>
              <Input value={editor} onChange={(e) => setEditor(e.target.value)} className="bg-background" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Deadline</Label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">URL (once published)</Label>
            <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://dailyausaf.com/…" className="bg-background" />
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
