import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, ScanLine, Plus, Minus, Trash2, X, ShoppingCart,
  CreditCard, Banknote, Smartphone, FileText, Receipt,
  CheckCircle2, User, Loader2,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { generateInvoicePDF } from "@/lib/invoicePdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProducts, type DbProduct } from "@/hooks/useProducts";
import { useCreateOrder } from "@/hooks/useOrders";
import { useTenant } from "@/contexts/TenantContext";
import { BarcodeScannerDialog } from "@/components/admin/BarcodeScannerDialog";

type CartItem = DbProduct & { qty: number };
type PaymentMode = "Cash" | "UPI" | "Card" | "Credit";

const PAYMENT_MODES: { mode: PaymentMode; icon: any }[] = [
  { mode: "Cash", icon: Banknote },
  { mode: "UPI", icon: Smartphone },
  { mode: "Card", icon: CreditCard },
  { mode: "Credit", icon: FileText },
];

const FALLBACK_IMG = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop";

export default function POS() {
  const { tenant } = useTenant();
  const { data: products = [], isLoading } = useProducts();
  const createOrder = useCreateOrder();

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [discount, setDiscount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => products.filter(p => {
    if (!p.is_active) return false;
    if (activeCat !== "All" && p.category !== activeCat) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q) && !(p.barcode ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  }), [products, query, activeCat]);

  const addToCart = (p: DbProduct) => {
    const stock = Number(p.stock_qty);
    if (stock === 0) { toast.error(`${p.name} is out of stock`); return; }
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id);
      if (existing) {
        if (existing.qty >= stock) { toast.warning(`Only ${stock} available`); return prev; }
        return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(c => {
      if (c.id !== id) return [c];
      const nq = c.qty + delta;
      if (nq <= 0) return [];
      if (nq > Number(c.stock_qty)) { toast.warning(`Only ${c.stock_qty} available`); return [c]; }
      return [{ ...c, qty: nq }];
    }));
  };

  const removeItem = (id: string) => setCart(p => p.filter(c => c.id !== id));

  const calc = useMemo(() => {
    let subtotal = 0;
    let cgst = 0, sgst = 0;
    const taxBreakup: Record<number, number> = {};
    cart.forEach(c => {
      const lineSub = c.qty * Number(c.price);
      subtotal += lineSub;
      const tax = (lineSub * Number(c.tax_rate)) / 100;
      cgst += tax / 2;
      sgst += tax / 2;
      taxBreakup[Number(c.tax_rate)] = (taxBreakup[Number(c.tax_rate)] || 0) + tax;
    });
    const afterDiscount = subtotal - discount;
    const total = afterDiscount + cgst + sgst;
    return { subtotal, discount, cgst, sgst, total, taxBreakup };
  }, [cart, discount]);

  const buildInvoiceItems = () => cart.map(c => ({
    name: c.name, hsnCode: c.hsn_code ?? "", qty: c.qty, unit: c.unit,
    unitPrice: Number(c.price), taxRate: Number(c.tax_rate),
  }));

  const storeForInvoice = tenant ? {
    name: tenant.name,
    address: tenant.address ?? "",
    city: tenant.city ?? "",
    state: tenant.state ?? "",
    pincode: tenant.pincode ?? "",
    phone: tenant.phone ?? "",
    email: tenant.email ?? "",
    gstin: tenant.gstin ?? "",
    upiId: (tenant.settings as any)?.upi_id ?? "",
  } : undefined;

  const handleCompleteSale = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    try {
      const items = cart.map(c => {
        const lineSub = c.qty * Number(c.price);
        const taxAmt = (lineSub * Number(c.tax_rate)) / 100;
        return {
          product_id: c.id,
          product_name: c.name,
          hsn_code: c.hsn_code,
          qty: c.qty,
          unit_price: Number(c.price),
          discount: 0,
          tax_rate: Number(c.tax_rate),
          tax_amount: taxAmt,
          total: lineSub + taxAmt,
        };
      });
      const order = await createOrder.mutateAsync({
        party_name: customer.name || "Walk-in Customer",
        party_phone: customer.phone || null,
        channel: "pos",
        payment_mode: paymentMode,
        payment_status: paymentMode === "Credit" ? "unpaid" : "paid",
        subtotal: calc.subtotal,
        discount,
        tax_amount: calc.cgst + calc.sgst,
        total: calc.total,
        paid_amount: paymentMode === "Credit" ? 0 : calc.total,
        balance_due: paymentMode === "Credit" ? calc.total : 0,
        items,
      });

      const doc = await generateInvoicePDF({
        invoiceNumber: order.order_number,
        date: new Date(),
        customerName: customer.name || "Walk-in Customer",
        customerPhone: customer.phone || undefined,
        paymentMode,
        items: buildInvoiceItems(),
        store: storeForInvoice,
      });
      doc.save(`Invoice-${order.order_number}.pdf`);
      setLastInvoice(order.order_number);
      toast.success(`Invoice ${order.order_number} generated`, {
        description: `${formatINR(calc.total)} · ${paymentMode}`,
      });
      setTimeout(() => {
        setCart([]); setCustomer({ name: "", phone: "" }); setDiscount(0); setShowCart(false);
      }, 600);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save sale");
    }
  };

  const previewInvoice = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    const doc = await generateInvoicePDF({
      invoiceNumber: "PREVIEW",
      date: new Date(),
      customerName: customer.name || "Walk-in Customer",
      customerPhone: customer.phone || undefined,
      paymentMode,
      items: buildInvoiceItems(),
      store: storeForInvoice,
    });
    window.open(doc.output("bloburl"), "_blank");
  };

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const onScanDetected = (code: string) => {
    setQuery(code);
    toast.success(`Barcode scanned: ${code}`);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden bg-muted/30">
      <div className="flex-1 flex flex-col min-w-0 lg:border-r border-border">
        <div className="p-4 bg-card border-b border-border space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search product / scan barcode..." className="pl-9 h-11 text-base" autoFocus />
            </div>
            <Button size="lg" variant="outline" className="px-3" onClick={() => setScannerOpen(true)}><ScanLine className="w-5 h-5" /></Button>
          </div>
          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {["All", ...categories].map(cat => (
                <button key={cat} onClick={() => setActiveCat(cat)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                    activeCat === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >{cat}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {products.length === 0 ? "No products yet — add some in the Products page." : "No products match your search"}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(p => {
                const inCart = cart.find(c => c.id === p.id);
                const out = Number(p.stock_qty) === 0;
                return (
                  <button key={p.id} disabled={out} onClick={() => addToCart(p)}
                    className={cn("group relative bg-card rounded-lg border border-border overflow-hidden text-left transition-all",
                      "hover:shadow-elegant hover:border-accent hover:-translate-y-0.5",
                      out && "opacity-50 cursor-not-allowed", inCart && "ring-2 ring-accent border-accent")}
                  >
                    <div className="aspect-square bg-muted relative">
                      <img src={p.image_url || FALLBACK_IMG} alt={p.name} className="w-full h-full object-cover" />
                      {inCart && (
                        <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xs shadow-lg">{inCart.qty}</div>
                      )}
                      {out && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-bold text-xs">OUT OF STOCK</span></div>}
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium leading-tight line-clamp-2 min-h-[2.25rem]">{p.name}</div>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <span className="font-display font-bold text-sm text-primary">{formatINR(Number(p.price), { decimals: false })}</span>
                        <span className="text-[10px] text-muted-foreground">{p.tax_rate}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={cn("w-full lg:w-[400px] xl:w-[440px] bg-card flex flex-col border-l border-border",
        "fixed lg:relative inset-0 lg:inset-auto z-40 transition-transform lg:transform-none",
        showCart ? "translate-x-0" : "translate-x-full lg:translate-x-0")}>
        <div className="p-4 border-b border-border flex items-center justify-between gradient-primary text-primary-foreground">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2"><Receipt className="w-5 h-5" /> Current Sale</h2>
            <p className="text-xs text-primary-foreground/70">{cartCount} item{cartCount !== 1 ? "s" : ""} in cart</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground hover:bg-white/10" onClick={() => setShowCart(false)}><X className="w-5 h-5" /></Button>
        </div>

        <div className="p-3 border-b border-border bg-muted/30 space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1"><User className="w-3 h-3" /> Customer</div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Name (optional)" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} className="h-8 text-sm" />
            <Input placeholder="Phone" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} className="h-8 text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
              <ShoppingCart className="w-12 h-12 opacity-30 mb-3" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Tap a product to add it</p>
            </div>
          ) : cart.map(c => {
            const lineSub = c.qty * Number(c.price);
            const lineTax = (lineSub * Number(c.tax_rate)) / 100;
            return (
              <div key={c.id} className="flex gap-2.5 p-2 rounded-lg bg-muted/40 border border-border/60">
                <img src={c.image_url || FALLBACK_IMG} alt="" className="w-12 h-12 rounded object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm leading-tight line-clamp-2">{c.name}</div>
                    <button onClick={() => removeItem(c.id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{formatINR(Number(c.price), { decimals: false })} × {c.qty} · GST {c.tax_rate}%</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1 bg-card rounded border border-border">
                      <button onClick={() => updateQty(c.id, -1)} className="px-2 py-1 hover:bg-muted"><Minus className="w-3 h-3" /></button>
                      <span className="px-2 text-sm font-semibold min-w-[24px] text-center">{c.qty}</span>
                      <button onClick={() => updateQty(c.id, 1)} className="px-2 py-1 hover:bg-muted"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="font-display font-bold text-sm">{formatINR(lineSub + lineTax)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-border bg-muted/20">
            <div className="p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatINR(calc.subtotal)}</span></div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Discount</span>
                <Input type="number" value={discount || ""} onChange={e => setDiscount(Number(e.target.value) || 0)} className="h-7 w-24 text-right text-sm" placeholder="0" />
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

            <div className="px-3 pb-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Payment</div>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_MODES.map(({ mode, icon: Icon }) => (
                  <button key={mode} onClick={() => setPaymentMode(mode)}
                    className={cn("p-2 rounded-md border text-xs font-medium transition-all flex flex-col items-center gap-1",
                      paymentMode === mode ? "border-accent bg-accent/10 text-accent shadow-sm" : "border-border bg-card text-muted-foreground hover:border-accent/50")}
                  ><Icon className="w-4 h-4" />{mode}</button>
                ))}
              </div>
            </div>

            <div className="p-3 pt-0 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={previewInvoice} className="h-11"><FileText className="w-4 h-4 mr-1.5" /> Preview</Button>
              <Button onClick={handleCompleteSale} disabled={createOrder.isPending} className="h-11 gradient-accent border-0 shadow-glow text-accent-foreground font-semibold">
                {createOrder.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                Complete Sale
              </Button>
            </div>

            {lastInvoice && (
              <div className="mx-3 mb-3 p-2 rounded bg-success/10 border border-success/30 text-xs text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Last invoice {lastInvoice} downloaded
              </div>
            )}
          </div>
        )}
      </div>

      {!showCart && (
        <button onClick={() => setShowCart(true)} className="lg:hidden fixed bottom-20 right-4 z-30 gradient-accent text-accent-foreground rounded-full px-5 py-3 shadow-glow flex items-center gap-2 font-semibold">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 ? <span>{cartCount} · {formatINR(calc.total, { decimals: false })}</span> : "Cart"}
        </button>
      )}
      
      <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onDetected={onScanDetected} />
    </div>
  );
}
