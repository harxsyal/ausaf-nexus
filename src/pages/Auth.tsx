import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, roleHomePath, AppRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import heroImg from "@/assets/newsroom-hero.jpg";
import { Radio, ShieldCheck, Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupRole, setSignupRole] = useState<AppRole>("social_media");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate(roleHomePath(role), { replace: true });
  }, [session, role, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Access granted");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, role: signupRole },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account provisioned. Signing in…");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Reset link dispatched to your inbox");
    setMode("login");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-border">
        <img
          src={heroImg}
          alt="Ausaf newsroom control center"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/70 to-background/95" />
        <div className="absolute inset-0 grid-tactical opacity-30" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="size-10 bg-primary grid place-items-center font-mono font-bold text-primary-foreground">
            A
          </div>
          <div className="leading-none">
            <div className="text-sm font-bold tracking-tight">AUSAF DIGITAL</div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.25em] mt-1">
              Management System v1.0
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Live Broadcast Operations
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.05]">
            The newsroom command center for{" "}
            <span className="text-primary">ABN News</span> &{" "}
            <span className="italic">Daily Ausaf</span>.
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Coordinate Social Media, Website, and Digital Production teams from a single
            tactical workspace. Role-based access, live task dispatch, and editorial sign-off.
          </p>
          <div className="flex gap-6 pt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-signal-green" /> RLS Secured</div>
            <div className="flex items-center gap-2"><Radio className="size-3.5 text-primary" /> Realtime Sync</div>
          </div>
        </div>

        <div className="relative z-10 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          © {new Date().getFullYear()} Ausaf Media Group · Internal use only
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3">
            <div className="size-9 bg-primary grid place-items-center font-mono font-bold text-primary-foreground">A</div>
            <div className="leading-none">
              <div className="text-sm font-bold">AUSAF DIGITAL</div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.25em] mt-1">Mgmt System</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              {mode === "login" && "Secure Access // Login"}
              {mode === "signup" && "Provision // New Operator"}
              {mode === "forgot" && "Recovery // Password Reset"}
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              {mode === "login" && "Welcome back"}
              {mode === "signup" && "Create operator profile"}
              {mode === "forgot" && "Forgot password"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "login" && "Enter your credentials to access the newsroom."}
              {mode === "signup" && "Register a new operator with departmental clearance."}
              {mode === "forgot" && "We'll send a recovery link to your inbox."}
            </p>
          </div>

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Username / Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@ausaf.com" autoComplete="username" className="bg-surface border-border h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" className="bg-surface border-border h-11" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <button type="button" onClick={() => setMode("forgot")} className="text-primary hover:underline font-medium">
                  Forgot password?
                </button>
              </div>
              <Button type="submit" disabled={busy} className="w-full h-11 font-mono uppercase tracking-widest text-xs">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Authenticate →"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                No account?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                  Request access
                </button>
              </p>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Full name</Label>
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-surface h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-surface h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Password</Label>
                <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-surface h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Department</Label>
                <select value={signupRole} onChange={(e) => setSignupRole(e.target.value as AppRole)}
                  className="w-full h-11 rounded-md bg-surface border border-border px-3 text-sm">
                  <option value="social_media">Social Media</option>
                  <option value="website">Website</option>
                  <option value="production">Digital Production</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <Button type="submit" disabled={busy} className="w-full h-11 font-mono uppercase tracking-widest text-xs">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Provision Account →"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already registered?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-medium">Sign in</button>
              </p>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-surface h-11" />
              </div>
              <Button type="submit" disabled={busy} className="w-full h-11 font-mono uppercase tracking-widest text-xs">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Send Reset Link →"}
              </Button>
              <p className="text-center text-sm">
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                  ← Back to login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
