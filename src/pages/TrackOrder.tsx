import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Package, Truck, XCircle, Search, Loader2, Crown, Phone, ArrowLeft } from "lucide-react";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

const STATUS_STEPS = [
  { key: "pending", label: "Order placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function TrackOrder() {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const o = sp.get("order"); const p = sp.get("phone");
    if (o && p) { setOrderNumber(o); setPhone(p); track(o, p); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const track = async (o = orderNumber, p = phone) => {
    if (!o || !p) { toast.error("Enter order number and phone"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("track_storefront_order", {
        _slug: slug, _order_number: o.trim(), _phone: p.trim(),
      });
      if (error) throw error;
      setOrder(data);
    } catch (e: any) { toast.error(e.message); setOrder(null); }
    finally { setLoading(false); }
  };

  const status = order?.status as string | undefined;
  const stepIdx = STATUS_STEPS.findIndex(s => s.key === status);
  const cancelled = status === "cancelled";

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong border-b border-white/40 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav(`/shop/${slug}`)}><ArrowLeft className="w-4 h-4 mr-1" />Store</Button>
          <h1 className="font-display font-bold text-base">Track your order</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-5">
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input placeholder="Order number (e.g. WEB-...)" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
            <Input placeholder="Phone used to order" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button onClick={() => track()} disabled={loading} className="gradient-accent border-0 shadow-glow text-accent-foreground">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}Track
            </Button>
          </div>
        </Card>

        {order && (
          <>
            <Card className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Order</div>
                  <div className="font-display font-bold text-lg">{order.order_number}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Placed {new Date(order.created_at).toLocaleString("en-IN")}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
                  <div className="font-display font-bold text-2xl">{formatINR(Number(order.total))}</div>
                  <Badge variant="outline" className="mt-1 capitalize">{order.payment_status}</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="font-display font-semibold text-sm mb-4">Status</h2>
              {cancelled ? (
                <div className="flex items-center gap-2 text-destructive font-semibold"><XCircle className="w-5 h-5" /> Order cancelled</div>
              ) : (
                <ol className="space-y-4">
                  {STATUS_STEPS.map((s, i) => {
                    const reached = i <= stepIdx;
                    const Icon = s.icon;
                    return (
                      <li key={s.key} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reached ? "gradient-accent text-accent-foreground shadow-glow" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-sm ${reached ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="font-display font-semibold text-sm mb-3">Items</h2>
              <ul className="divide-y">
                {(order.items ?? []).map((it: any, i: number) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <div className="truncate">{it.product_name} <span className="text-muted-foreground">× {it.qty}</span></div>
                    <div className="font-semibold tabular-nums">{formatINR(Number(it.total))}</div>
                  </li>
                ))}
              </ul>
            </Card>

            {order.tenant_phone && (
              <Card className="p-4 flex items-center justify-between">
                <div className="text-sm">Need help? Contact <strong>{order.tenant_name}</strong></div>
                <a href={`tel:${order.tenant_phone}`} className="text-sm font-semibold text-primary flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{order.tenant_phone}</a>
              </Card>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border mt-10">
        <div className="max-w-3xl mx-auto px-4 py-4 text-xs text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()}</span>
          <Link to="/" className="flex items-center gap-1 hover:text-foreground"><Crown className="w-3 h-3 text-accent" /> Powered by VyaparOS</Link>
        </div>
      </footer>
    </div>
  );
}
