import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, FileText, Receipt, Save, Loader2, ExternalLink, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { useTenant } from "@/contexts/TenantContext";
import { useUpdateTenant } from "@/hooks/useTenantUpdate";
import { toast } from "sonner";

const TABS = [
  { id: "store", label: "Store Profile", icon: Store },
  { id: "invoice", label: "Invoice", icon: FileText },
  { id: "tax", label: "Tax / GST", icon: Receipt },
];

export default function Settings() {
  const { tenant } = useTenant();
  const update = useUpdateTenant();
  const [tab, setTab] = useState("store");
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (tenant) setForm({
      name: tenant.name, gstin: tenant.gstin ?? "", phone: tenant.phone ?? "", email: tenant.email ?? "",
      address: tenant.address ?? "", city: tenant.city ?? "", state: tenant.state ?? "", pincode: tenant.pincode ?? "",
      upi_id: (tenant.settings as any)?.upi_id ?? "",
      invoice_prefix: (tenant.settings as any)?.invoice_prefix ?? "INV",
      default_tax_rate: (tenant.settings as any)?.default_tax_rate ?? 18,
      terms: (tenant.settings as any)?.terms ?? "",
    });
  }, [tenant]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    try {
      await update.mutateAsync({
        name: form.name, gstin: form.gstin || null, phone: form.phone || null, email: form.email || null,
        address: form.address || null, city: form.city || null, state: form.state || null, pincode: form.pincode || null,
        settings: { ...(tenant?.settings as any ?? {}), upi_id: form.upi_id, invoice_prefix: form.invoice_prefix, default_tax_rate: form.default_tax_rate, terms: form.terms },
      });
      toast.success("Settings saved");
    } catch (e: any) { toast.error(e.message); }
  };

  if (!tenant) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin" /></div>;

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="Configuration" title="Settings" description="Configure store, invoices and taxes"
        actions={<Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" onClick={save} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}Save Changes</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-2 lg:sticky lg:top-20 lg:self-start">
          <div className="flex lg:flex-col gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  tab === t.id ? "gradient-royal text-white shadow-elegant" : "text-muted-foreground hover:bg-muted/50")}>
                <t.icon className="w-4 h-4 shrink-0" /><span>{t.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-3">
          {tab === "store" && (
            <div className="space-y-4">
              <Card className="p-5 border-accent/30 bg-accent/5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Public Storefront</div>
                    <h3 className="font-display font-semibold text-base mt-0.5">Your customers can order from here</h3>
                    <div className="text-xs font-mono mt-1 text-primary truncate">{window.location.origin}/shop/{tenant.slug}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={async () => {
                      await navigator.clipboard.writeText(`${window.location.origin}/shop/${tenant.slug}`);
                      toast.success("Storefront link copied");
                    }}><Copy className="w-3.5 h-3.5 mr-1.5" />Copy</Button>
                    <Button size="sm" className="gradient-accent border-0 text-accent-foreground" asChild>
                      <a href={`/shop/${tenant.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open</a>
                    </Button>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="font-display font-bold text-lg mb-4">Store Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Store Name" value={form.name ?? ""} onChange={v => set("name", v)} />
                  <Field label="Phone" value={form.phone ?? ""} onChange={v => set("phone", v)} />
                  <Field label="Email" value={form.email ?? ""} onChange={v => set("email", v)} />
                  <Field label="GSTIN" value={form.gstin ?? ""} onChange={v => set("gstin", v.toUpperCase())} />
                  <Field label="UPI ID" value={form.upi_id ?? ""} onChange={v => set("upi_id", v)} />
                  <Field label="Pincode" value={form.pincode ?? ""} onChange={v => set("pincode", v)} />
                  <Field label="Address" value={form.address ?? ""} onChange={v => set("address", v)} className="md:col-span-2" />
                  <Field label="City" value={form.city ?? ""} onChange={v => set("city", v)} />
                  <Field label="State" value={form.state ?? ""} onChange={v => set("state", v)} />
                </div>
              </Card>
            </div>
          )}

          {tab === "invoice" && (
            <Card className="p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Invoice Settings</h2>
              <Field label="Invoice Prefix" value={form.invoice_prefix ?? ""} onChange={v => set("invoice_prefix", v)} />
              <div><Label className="text-xs">Terms & Conditions</Label>
                <textarea className="mt-1.5 w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm" value={form.terms ?? ""} onChange={e => set("terms", e.target.value)} /></div>
            </Card>
          )}

          {tab === "tax" && (
            <Card className="p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Tax & GST</h2>
              <Field label="Default GST Rate (%)" value={String(form.default_tax_rate ?? 18)} onChange={v => set("default_tax_rate", Number(v))} />
              <Field label="GSTIN" value={form.gstin ?? ""} onChange={v => set("gstin", v.toUpperCase())} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, className }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} className="mt-1.5" />
    </div>
  );
}
