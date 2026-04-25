import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, ScanLine, Plus, Minus, Trash2, X, ShoppingCart,
  CreditCard, Banknote, Smartphone, FileText, Receipt,
  CheckCircle2, User,
} from "lucide-react";
import { PRODUCTS, CATEGORIES, STORE, type Product } from "@/data/mockData";
import { formatINR } from "@/lib/format";
import { generateInvoicePDF } from "@/lib/invoicePdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CartItem = Product & { qty: number; lineDiscount: number };
type PaymentMode = "Cash" | "UPI" | "Card" | "Credit";

const PAYMENT_MODES: { mode: PaymentMode; icon: any; color: string }[] = [
  { mode: "Cash", icon: Banknote, color: "from-green-500 to-emerald-600" },
  { mode: "UPI", icon: Smartphone, color: "from-blue-500 to-indigo-600" },
  { mode: "Card", icon: CreditCard, color: "from-purple-500 to-pink-600" },
  { mode: "Credit", icon: FileText, color: "from-amber-500 to-orange-600" },
];

export default function POS() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [discount, setDiscount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (activeCat !== "All" && p.category !== activeCat) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase()) && !p.sku.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, activeCat]);

  const addToCart = (p: Product) => {
    if (p.stock === 0) { toast.error(`${p.name} is out of stock`); return; }
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id);
      if (existing) {
        if (existing.qty >= p.stock) { toast.warning(`Only ${p.stock} available`); return prev; }
        return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...p, qty: 1, lineDiscount: 0 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(c => {
      if (c.id !== id) return [c];
      const nq = c.qty + delta;
      if (nq <= 0) return [];
      if (nq > c.stock) { toast.warning(`Only ${c.stock} available`); return [c]; }
      return [{ ...c, qty: nq }];
    }));
  };

  const removeItem = (id: string) => setCart(p => p.filter(c => c.id !== id));

  // Calculations
  const calc = useMemo(() => {
    let subtotal = 0;
    let cgst = 0, sgst = 0;
    const taxBreakup: Record<number, number> = {};
    cart.forEach(c => {
      const lineSub = c.qty * c.price;
      subtotal += lineSub;
      const tax = (lineSub * c.taxRate) / 100;
      cgst += tax / 2;
      sgst += tax / 2;
      taxBreakup[c.taxRate] = (taxBreakup[c.taxRate] || 0) + tax;
    });
    const afterDiscount = subtotal - discount;
    const total = afterDiscount + cgst + sgst;
    return { subtotal, discount, cgst, sgst, total, taxBreakup };
  }, [cart, discount]);

  const handleGenerateInvoice = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    const invoiceNumber = `${STORE.invoicePrefix}-${1042 + Math.floor(Math.random() * 100)}`;
    const doc = await generateInvoicePDF({
      invoiceNumber,
      date: new Date(),
      customerName: customer.name || "Walk-in Customer",
      customerPhone: customer.phone || undefined,
      paymentMode,
      isInterstate: false,
      items: cart.map(c => ({
        name: c.name,
        hsnCode: c.hsnCode,
        qty: c.qty,
        unit: c.unit,
        unitPrice: c.price,
        taxRate: c.taxRate,
      })),
    });
    doc.save(`Invoice-${invoiceNumber}.pdf`);
    setLastInvoice(invoiceNumber);
    toast.success(`Invoice ${invoiceNumber} generated`, {
      description: `${formatINR(calc.total)} · ${paymentMode}`,
    });
    // Reset cart
    setTimeout(() => {
      setCart([]); setCustomer({ name: "", phone: "" }); setDiscount(0); setShowCart(false);
    }, 600);
  };

  const previewInvoice = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    const doc = await generateInvoicePDF({
      invoiceNumber: "PREVIEW-001",
      date: new Date(),
      customerName: customer.name || "Walk-in Customer",
      customerPhone: customer.phone || undefined,
      paymentMode,
      items: cart.map(c => ({
        name: c.name, hsnCode: c.hsnCode, qty: c.qty, unit: c.unit, unitPrice: c.price, taxRate: c.taxRate,
      })),
    });
    window.open(doc.output("bloburl"), "_blank");
  };

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden bg-muted/30">
      {/* === LEFT: Product picker === */}
      <div className="flex-1 flex flex-col min-w-0 lg:border-r border-border">
        {/* Search bar */}
        <div className="p-4 bg-card border-b border-border space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search product / scan barcode..."
                className="pl-9 h-11 text-base"
                autoFocus
              />
            </div>
            <Button size="lg" variant="outline" className="px-3">
              <ScanLine className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {["All", ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  activeCat === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(p => {
              const inCart = cart.find(c => c.id === p.id);
              const out = p.stock === 0;
              return (
                <button
                  key={p.id}
                  disabled={out}
                  onClick={() => addToCart(p)}
                  className={cn(
                    "group relative bg-card rounded-lg border border-border overflow-hidden text-left transition-all",
                    "hover:shadow-elegant hover:border-accent hover:-translate-y-0.5",
                    out && "opacity-50 cursor-not-allowed",
                    inCart && "ring-2 ring-accent border-accent"
                  )}
                >
                  <div className="aspect-square bg-muted relative">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    {inCart && (
                      <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xs shadow-lg">
                        {inCart.qty}
                      </div>
                    )}
                    {out && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">OUT OF STOCK</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-medium leading-tight line-clamp-2 min-h-[2.25rem]">{p.name}</div>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="font-display font-bold text-sm text-primary">{formatINR(p.price, { decimals: false })}</span>
                      <span className="text-[10px] text-muted-foreground">{p.taxRate}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No products found</div>
          )}
        </div>
      </div>

      {/* === RIGHT: Cart panel === */}
      <div className={cn(
        "w-full lg:w-[400px] xl:w-[440px] bg-card flex flex-col border-l border-border",
        "fixed lg:relative inset-0 lg:inset-auto z-40 transition-transform lg:transform-none",
        showCart ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between gradient-primary text-primary-foreground">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Current Sale
            </h2>
            <p className="text-xs text-primary-foreground/70">{cartCount} item{cartCount !== 1 ? "s" : ""} in cart</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground hover:bg-white/10" onClick={() => setShowCart(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Customer */}
        <div className="p-3 border-b border-border bg-muted/30 space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
            <User className="w-3 h-3" /> Customer
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Name (optional)"
              value={customer.name}
              onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Phone"
              value={customer.phone}
              onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
              <ShoppingCart className="w-12 h-12 opacity-30 mb-3" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Tap a product to add it</p>
            </div>
          ) : cart.map(c => {
            const lineSub = c.qty * c.price;
            const lineTax = (lineSub * c.taxRate) / 100;
            return (
              <div key={c.id} className="flex gap-2.5 p-2 rounded-lg bg-muted/40 border border-border/60">
                <img src={c.image} alt="" className="w-12 h-12 rounded object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm leading-tight line-clamp-2">{c.name}</div>
                    <button onClick={() => removeItem(c.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {formatINR(c.price, { decimals: false })} × {c.qty} · GST {c.taxRate}%
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1 bg-card rounded border border-border">
                      <button onClick={() => updateQty(c.id, -1)} className="px-2 py-1 hover:bg-muted">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-sm font-semibold min-w-[24px] text-center">{c.qty}</span>
                      <button onClick={() => updateQty(c.id, 1)} className="px-2 py-1 hover:bg-muted">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-display font-bold text-sm">{formatINR(lineSub + lineTax)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="border-t border-border bg-muted/20">
            <div className="p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{formatINR(calc.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Discount</span>
                <Input
                  type="number"
                  value={discount || ""}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  className="h-7 w-24 text-right text-sm"
                  placeholder="0"
                />
              </div>
              {Object.entries(calc.taxBreakup).map(([rate, amt]) => (
                <div key={rate} className="flex justify-between text-xs text-muted-foreground">
                  <span>GST @ {rate}% (CGST {Number(rate)/2}% + SGST {Number(rate)/2}%)</span>
                  <span>{formatINR(amt)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-display font-bold text-base">Total</span>
                <span className="font-display font-bold text-xl text-primary">{formatINR(calc.total)}</span>
              </div>
            </div>

            {/* Payment modes */}
            <div className="px-3 pb-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Payment</div>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_MODES.map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={cn(
                      "p-2 rounded-md border text-xs font-medium transition-all flex flex-col items-center gap-1",
                      paymentMode === mode
                        ? "border-accent bg-accent/10 text-accent shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-accent/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 pt-0 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={previewInvoice} className="h-11">
                <FileText className="w-4 h-4 mr-1.5" /> Preview
              </Button>
              <Button onClick={handleGenerateInvoice} className="h-11 gradient-accent border-0 shadow-glow font-semibold">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Sale
              </Button>
            </div>

            {lastInvoice && (
              <div className="mx-3 mb-3 p-2 rounded bg-success/10 border border-success/30 text-xs text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Last invoice {lastInvoice} downloaded
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile cart toggle */}
      {!showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-20 right-4 z-30 gradient-accent text-accent-foreground rounded-full px-5 py-3 shadow-glow flex items-center gap-2 font-semibold"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && <span>{cartCount} · {formatINR(calc.total, { decimals: false })}</span>}
          {cartCount === 0 && "Cart"}
        </button>
      )}
    </div>
  );
}
