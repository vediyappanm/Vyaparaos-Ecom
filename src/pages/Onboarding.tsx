import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Crown, Loader2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export default function Onboarding() {
  const nav = useNavigate();
  const { session, loading: aLoad } = useAuth();
  const { tenant, refresh, loading: tLoad } = useTenant();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gstin: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (!aLoad && !session) nav("/auth", { replace: true });
    if (!tLoad && tenant) nav("/admin", { replace: true });
  }, [aLoad, tLoad, session, tenant, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setBusy(true);
    try {
      // Slug uniqueness — append a short id if needed
      let baseSlug = slugify(form.name) || "store";
      let slug = baseSlug;
      const { data: existing } = await supabase.from("tenants").select("id").eq("slug", slug).maybeSingle();
      if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

      const { data: tenantRow, error: tErr } = await supabase
        .from("tenants")
        .insert({
          name: form.name,
          slug,
          gstin: form.gstin || null,
          phone: form.phone || null,
          city: form.city || null,
          state: form.state || null,
          pincode: form.pincode || null,
        })
        .select()
        .single();
      if (tErr) throw tErr;

      const { error: rErr } = await supabase
        .from("user_roles")
        .insert({ user_id: session.user.id, tenant_id: tenantRow.id, role: "owner" });
      if (rErr) throw rErr;

      // Seed default cash/bank/UPI accounts
      await supabase.from("accounts").insert([
        { tenant_id: tenantRow.id, name: "Cash in Hand", type: "cash", balance: 0 },
        { tenant_id: tenantRow.id, name: "Bank Account", type: "bank", balance: 0 },
        { tenant_id: tenantRow.id, name: "UPI Wallet", type: "upi", balance: 0 },
      ]);

      toast.success(`Welcome to ${tenantRow.name}!`);
      await refresh();
      nav("/admin", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not create store");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-[hsl(265_60%_14%)] via-[hsl(280_55%_16%)] to-[hsl(265_70%_10%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[hsl(43_90%_60%/0.18)] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[hsl(310_70%_50%/0.18)] blur-3xl" />
      </div>

      <Card className="w-full max-w-lg p-7 relative z-10 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl gradient-accent flex items-center justify-center shadow-glow">
            <Crown className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-tight">Set up your store</div>
            <div className="text-xs text-muted-foreground">Just the basics — you can change everything later.</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Store name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sharma Royal Mart" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>GSTIN</Label>
              <Input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} placeholder="29ABCDE1234F1Z5" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98xxx xxxxx" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>City</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Bengaluru" />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="560038" />
            </div>
          </div>
          <div>
            <Label>State</Label>
            <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="Karnataka" />
          </div>

          <Button type="submit" disabled={busy || !form.name} className="w-full gradient-accent border-0 shadow-glow text-accent-foreground font-semibold">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Store className="w-4 h-4 mr-2" />}
            Create my store
          </Button>
        </form>
      </Card>
    </div>
  );
}
