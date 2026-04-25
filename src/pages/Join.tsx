import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, Check, AlertCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useRedeemInvite } from "@/hooks/useInvites";
import { toast } from "sonner";

type Preview = { tenant_name: string; role: string; expires_at: string } | null;

export default function Join() {
  const { code = "" } = useParams();
  const nav = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { refresh } = useTenant();
  const redeem = useRedeemInvite();
  const [preview, setPreview] = useState<Preview>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Lookup invite preview (unauthenticated users see basic info too via tenant name)
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tenant_invites" as any)
        .select("role, expires_at, tenants(name)")
        .eq("code", code)
        .is("accepted_at", null)
        .maybeSingle();
      if (!active) return;
      if (!data) setPreviewError("This invite is invalid, expired or already used.");
      else setPreview({ tenant_name: (data as any).tenants?.name ?? "Workspace", role: (data as any).role, expires_at: (data as any).expires_at });
      setLoading(false);
    })();
    return () => { active = false; };
  }, [code]);

  const handleRedeem = async () => {
    try {
      await redeem.mutateAsync(code);
      await refresh();
      toast.success(`Welcome to ${preview?.tenant_name}!`);
      nav("/admin", { replace: true });
    } catch (e: any) { toast.error(e.message); }
  };

  const goSignIn = () => {
    sessionStorage.setItem("post_auth_redirect", `/join/${code}`);
    nav("/auth");
  };

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[hsl(265_60%_14%)] via-[hsl(280_55%_16%)] to-[hsl(265_70%_10%)]">
      <Card className="w-full max-w-md p-7 backdrop-blur-xl">
        <Link to="/" className="flex items-center justify-center gap-2 mb-5">
          <div className="w-11 h-11 rounded-xl gradient-accent flex items-center justify-center shadow-glow">
            <Crown className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-tight">VyaparOS</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-gold">Royal Commerce OS</div>
          </div>
        </Link>

        {previewError ? (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center"><AlertCircle className="w-6 h-6 text-destructive" /></div>
            <h1 className="font-display font-bold text-xl">Invite unavailable</h1>
            <p className="text-sm text-muted-foreground">{previewError}</p>
            <Button asChild variant="outline"><Link to="/">Go home</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl gradient-royal text-white flex items-center justify-center mb-3"><Building2 className="w-7 h-7" /></div>
              <h1 className="font-display font-bold text-xl">You're invited!</h1>
              <p className="text-sm text-muted-foreground mt-1">Join <span className="font-semibold text-foreground">{preview?.tenant_name}</span> on VyaparOS</p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="font-semibold capitalize">{preview?.role}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Code</span>
                <span className="font-mono font-bold text-primary">{code}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Expires</span>
                <span>{preview && new Date(preview.expires_at).toLocaleDateString("en-IN")}</span>
              </div>
            </div>

            {session ? (
              <Button className="w-full gradient-accent border-0 shadow-glow text-accent-foreground font-semibold" onClick={handleRedeem} disabled={redeem.isPending}>
                {redeem.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Accept invite
              </Button>
            ) : (
              <>
                <Button className="w-full gradient-accent border-0 shadow-glow text-accent-foreground font-semibold" onClick={goSignIn}>
                  Sign in or create account
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">After signing in, you'll be brought back here to accept.</p>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
