import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signUp, signIn, setSession } from "@/lib/auth";
import { toast } from "sonner";

export default function Auth() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) {
      const dest = sessionStorage.getItem("post_auth_redirect");
      if (dest) { sessionStorage.removeItem("post_auth_redirect"); nav(dest, { replace: true }); }
      else nav("/admin", { replace: true });
    }
  }, [session, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { user, token } = await signUp(email, password, fullName);
        setSession(user, token);
        toast.success("Account created — signing you in…");
      } else {
        const { user, token } = await signIn(email, password);
        setSession(user, token);
        toast.success("Welcome back!");
      }
      // Force reload to update auth context
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    toast.error("Google sign-in not available with local database");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-[hsl(265_60%_14%)] via-[hsl(280_55%_16%)] to-[hsl(265_70%_10%)]">
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[hsl(43_90%_60%/0.18)] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[hsl(310_70%_50%/0.18)] blur-3xl" />
      </div>

      <Card className="w-full max-w-md p-7 relative z-10 backdrop-blur-xl">
        <Link to="/" className="flex items-center justify-center gap-2 mb-5">
          <div className="w-11 h-11 rounded-xl gradient-accent flex items-center justify-center shadow-glow">
            <Crown className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-tight">VyaparOS</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-gold">Royal Commerce OS</div>
          </div>
        </Link>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-3 mt-4">
            <TabsContent value="signup" className="space-y-3 mt-0">
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rajesh Sharma" required={mode === "signup"} />
              </div>
            </TabsContent>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.in" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
            </div>

            <Button type="submit" disabled={busy} className="w-full gradient-accent border-0 shadow-glow text-accent-foreground font-semibold">
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
        </Tabs>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button type="button" variant="outline" onClick={handleGoogle} disabled={busy} className="w-full">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </Button>

        <p className="text-[11px] text-center text-muted-foreground mt-5">
          By continuing you agree to our terms. Your data stays in your tenant.
        </p>
      </Card>
    </div>
  );
}
