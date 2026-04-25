import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, Loader2, Phone, MapPin, MessageCircle, Search, Crown, Store } from "lucide-react";
import { formatINR } from "@/lib/format";

type Tenant = { id: string; name: string; slug: string; phone: string | null; address: string | null; city: string | null; state: string | null; logo_url: string | null; settings: any };
type Product = { id: string; name: string; description: string | null; price: number; mrp: number; image_url: string | null; stock_qty: number; category: string | null; unit: string };
type CartItem = Product & { qty: number };

export default function Storefront() {
  const { slug = "" } = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [customer, setCustomer] = useState({ name: "", phone: "", note: "" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: t } = await supabase.from("tenants").select("*").eq("slug", slug).maybeSingle();
      if (!t) { setLoading(false); return; }
      setTenant(t as any);
      const { data: p } = await supabase
        .from("products")
        .select("id, name, description, price, mrp, image_url, stock_qty, category, unit")
        .eq("tenant_id", (t as any).id)
        .eq("is_active", true)
        .order("name");
      setProducts((p ?? []) as any);
      setLoading(false);
    })();
  }, [slug]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.category && s.add(p.category));
    return ["all", ...Array.from(s)];
  }, [products]);

  const filtered = products.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const addToCart = (p: Product) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.id === p.id);
      if (i >= 0) { const cp = [...c]; cp[i] = { ...cp[i], qty: cp[i].qty + 1 }; return cp; }
      return [...c, { ...p, qty: 1 }];
    });
  };
  const updateQty = (id: string, delta: number) => {
    setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: Math.max(0, x.qty + delta) } : x)).filter((x) => x.qty > 0));
  };
  const removeFromCart = (id: string) => setCart((c) => c.filter((x) => x.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.qty * Number(i.price), 0);

  const placeOrder = () => {
    if (!cart.length) return;
    if (!customer.name || !customer.phone) { alert("Please enter your name and phone"); return; }
    const lines = cart.map((i) => `• ${i.name} × ${i.qty} = ${formatINR(i.qty * Number(i.price))}`).join("\n");
    const msg =
      `*New Order — ${tenant?.name}*\n\n` +
      `*Customer:* ${customer.name}\n*Phone:* ${customer.phone}\n` +
      (customer.note ? `*Note:* ${customer.note}\n` : "") +
      `\n*Items:*\n${lines}\n\n*Total: ${formatINR(subtotal)}*`;
    const phone = (tenant?.phone ?? "").replace(/[^0-9]/g, "");
    const url = phone
      ? `https://wa.me/${phone.length === 10 ? "91" + phone : phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!tenant) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="p-8 text-center max-w-md">
        <Store className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="font-display font-bold text-xl mt-3">Store not found</h1>
        <p className="text-sm text-muted-foreground mt-1">No store exists at this URL.</p>
        <Button asChild className="mt-4"><Link to="/">Go home</Link></Button>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-strong border-b border-white/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg gradient-royal text-white flex items-center justify-center"><Store className="w-5 h-5" /></div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-base leading-tight truncate">{tenant.name}</h1>
            <div className="text-[11px] text-muted-foreground flex items-center gap-2 truncate">
              {tenant.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{tenant.city}</span>}
              {tenant.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{tenant.phone}</span>}
            </div>
          </div>
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => document.getElementById("cart")?.scrollIntoView({ behavior: "smooth" })}>
              <ShoppingCart className="w-4 h-4 mr-1.5" /> {cart.length}
            </Button>
            {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Search + categories */}
        <div className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors capitalize ${
                    category === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
                  }`}>{c}</button>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">No products match.</Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const inCart = cart.find((c) => c.id === p.id);
              const out = p.stock_qty <= 0;
              return (
                <Card key={p.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-square bg-muted relative">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Store className="w-8 h-8" /></div>}
                    {out && <div className="absolute inset-0 bg-background/70 flex items-center justify-center"><Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Out of stock</Badge></div>}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="text-sm font-semibold line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-display font-bold text-base">{formatINR(Number(p.price), { decimals: false })}</span>
                      {Number(p.mrp) > Number(p.price) && <span className="text-[10px] text-muted-foreground line-through">{formatINR(Number(p.mrp), { decimals: false })}</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">per {p.unit}</div>
                    <div className="mt-2">
                      {inCart ? (
                        <div className="flex items-center justify-between gap-1 border rounded-md p-0.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(p.id, -1)}><Minus className="w-3 h-3" /></Button>
                          <span className="text-sm font-bold tabular-nums">{inCart.qty}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(p.id, 1)} disabled={inCart.qty >= p.stock_qty}><Plus className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full h-8" disabled={out} onClick={() => addToCart(p)}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cart */}
        {cart.length > 0 && (
          <Card id="cart" className="p-5 sticky bottom-4 shadow-elevated border-accent/40">
            <h2 className="font-display font-semibold text-lg mb-3">Your order</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cart.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 truncate">{i.name} <span className="text-muted-foreground">× {i.qty}</span></div>
                  <div className="font-semibold tabular-nums">{formatINR(i.qty * Number(i.price))}</div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(i.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-display font-bold text-xl">{formatINR(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Input placeholder="Your name *" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              <Input placeholder="Phone *" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              <Input className="col-span-2" placeholder="Address / note (optional)" value={customer.note} onChange={(e) => setCustomer({ ...customer, note: e.target.value })} />
            </div>
            <Button onClick={placeOrder} className="w-full mt-3 gradient-accent border-0 shadow-glow text-accent-foreground font-semibold" size="lg">
              <MessageCircle className="w-4 h-4 mr-2" /> Order via WhatsApp
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-2">Order is sent as a WhatsApp message to the store. They'll confirm & deliver.</p>
          </Card>
        )}
      </main>

      <footer className="border-t border-border mt-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {tenant.name}</span>
          <Link to="/" className="flex items-center gap-1 hover:text-foreground"><Crown className="w-3 h-3 text-accent" /> Powered by VyaparOS</Link>
        </div>
      </footer>
    </div>
  );
}
