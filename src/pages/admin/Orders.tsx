import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ScanLine, ShoppingCart, ChevronRight, Loader2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { formatINR, formatDateIN } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { useOrders } from "@/hooks/useOrders";
import { generateInvoicePDF } from "@/lib/invoicePdf";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  packed: "bg-warning/15 text-warning-foreground border-warning/30",
  shipped: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const PAY_STYLES: Record<string, string> = {
  paid: "bg-success/10 text-success",
  unpaid: "bg-destructive/10 text-destructive",
  partial: "bg-warning/15 text-warning-foreground",
};

export default function Orders() {
  const { tenant } = useTenant();
  const { data: orders = [], isLoading } = useOrders(200);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");

  const filtered = useMemo(() => orders.filter((o: any) => {
    if (filter !== "All" && o.status !== filter.toLowerCase()) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!o.order_number.toLowerCase().includes(q) && !(o.party_name ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  }), [orders, query, filter]);

  const summary = useMemo(() => {
    const total = orders.reduce((s: number, o: any) => s + Number(o.total), 0);
    const pending = orders.filter((o: any) => o.payment_status !== "paid").reduce((s: number, o: any) => s + Number(o.balance_due), 0);
    const delivered = orders.filter((o: any) => o.status === "delivered").length;
    return { total, pending, count: orders.length, delivered };
  }, [orders]);

  const downloadInvoice = async (o: any) => {
    try {
      const items = (o.order_items ?? []).map((it: any) => ({
        name: it.product_name, hsnCode: it.hsn_code ?? "", qty: Number(it.qty), unit: "pc",
        unitPrice: Number(it.unit_price), taxRate: Number(it.tax_rate),
      }));
      const doc = await generateInvoicePDF({
        invoiceNumber: o.order_number,
        date: new Date(o.created_at),
        customerName: o.party_name ?? "Walk-in Customer",
        customerPhone: o.party_phone ?? undefined,
        paymentMode: o.payment_mode ?? "Cash",
        items,
        store: tenant ? {
          name: tenant.name, address: tenant.address ?? "", city: tenant.city ?? "",
          state: tenant.state ?? "", pincode: tenant.pincode ?? "", phone: tenant.phone ?? "",
          email: tenant.email ?? "", gstin: tenant.gstin ?? "",
          upiId: (tenant.settings as any)?.upi_id ?? "",
        } : undefined,
      });
      doc.save(`Invoice-${o.order_number}.pdf`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description={`${orders.length} orders · ${formatINR(summary.total, { decimals: false })} total value`}
        actions={
          <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" asChild>
            <Link to="/admin/pos"><ScanLine className="w-4 h-4 mr-1.5" /> New Sale</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Total Orders", v: summary.count, sub: "All time" },
          { l: "Total Sales", v: formatINR(summary.total, { decimals: false }), sub: "Gross value" },
          { l: "Delivered", v: summary.delivered, sub: "Completed" },
          { l: "Outstanding", v: formatINR(summary.pending, { decimals: false }), sub: "Unpaid", warn: true },
        ].map(s => (
          <Card key={s.l} className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.l}</div>
            <div className={cn("font-display font-bold text-xl mt-1", s.warn && "text-destructive")}>{s.v}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
          </Card>
        ))}
      </div>

      <Card className="p-3">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by order # or customer..." className="pl-9" />
          </div>
        </div>
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
          {["All", "Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === s ? "bg-primary text-primary-foreground shadow-elegant" : "bg-white/50 text-muted-foreground hover:bg-white/80")}
            >{s}</button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase text-muted-foreground bg-white/30">
                <tr>
                  <th className="text-left font-semibold py-3 px-4">Order</th>
                  <th className="text-left font-semibold py-3">Customer</th>
                  <th className="text-left font-semibold py-3 hidden md:table-cell">Date</th>
                  <th className="text-left font-semibold py-3 hidden lg:table-cell">Channel</th>
                  <th className="text-right font-semibold py-3">Total</th>
                  <th className="text-left font-semibold py-3 hidden sm:table-cell">Payment</th>
                  <th className="text-left font-semibold py-3">Status</th>
                  <th className="text-right font-semibold py-3 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((o: any) => (
                  <tr key={o.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-bold text-primary">{o.order_number}</div>
                      <div className="text-[10px] text-muted-foreground">{(o.order_items ?? []).length} items</div>
                    </td>
                    <td className="py-3">
                      <div className="font-medium">{o.party_name ?? "Walk-in"}</div>
                      <div className="text-xs text-muted-foreground">{o.party_phone ?? "—"}</div>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground hidden md:table-cell">{formatDateIN(new Date(o.created_at))}</td>
                    <td className="py-3 hidden lg:table-cell"><Badge variant="outline" className="text-[10px]">{o.channel}</Badge></td>
                    <td className="py-3 text-right">
                      <div className="font-display font-bold">{formatINR(Number(o.total), { decimals: false })}</div>
                      <div className="text-[10px] text-muted-foreground">+{formatINR(Number(o.tax_amount), { decimals: false })} tax</div>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <Badge className={cn("border-0 text-[10px]", PAY_STYLES[o.payment_status])}>{o.payment_mode} · {o.payment_status}</Badge>
                    </td>
                    <td className="py-3"><Badge variant="outline" className={cn("font-medium border capitalize", STATUS_STYLES[o.status])}>{o.status}</Badge></td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadInvoice(o)} title="Download invoice">
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">{orders.length === 0 ? "No orders yet — make your first sale from the POS." : "No orders match your filters"}</p>
            {orders.length === 0 && (
              <Button asChild className="mt-4 gradient-accent border-0 text-accent-foreground">
                <Link to="/admin/pos"><ScanLine className="w-4 h-4 mr-1.5" /> Open POS</Link>
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
