import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // supabase auto-handles the recovery hash; verify a session exists
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) toast.message("Open this page from the email link to reset.");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 border border-border bg-surface p-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Recovery</div>
          <h1 className="text-2xl font-bold mt-1">Set new password</h1>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">New password</Label>
          <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy} className="w-full h-11 font-mono uppercase tracking-widest text-xs">
          Update Password →
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
