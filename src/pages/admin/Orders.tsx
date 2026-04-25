import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Filter, Download, ScanLine, FileText,
  ShoppingCart, ChevronRight, MoreHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ORDERS, type OrderStatus } from "@/data/mockData";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-muted text-muted-foreground",
  Confirmed: "bg-primary/10 text-primary border-primary/20",
  Packed: "bg-warning/15 text-warning-foreground border-warning/30",
  Shipped: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  Delivered: "bg-success/10 text-success border-success/20",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const PAY_STYLES: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Pending: "bg-destructive/10 text-destructive",
  Partial: "bg-warning/15 text-warning-foreground",
};

export default function Orders() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "All">("All");

  const filtered = useMemo(() => ORDERS.filter(o => {
    if (filter !== "All" && o.status !== filter) return false;
    if (query && !o.id.toLowerCase().includes(query.toLowerCase()) && !o.customer.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [query, filter]);

  const summary = useMemo(() => {
    const total = ORDERS.reduce((s, o) => s + o.total, 0);
    const pending = ORDERS.filter(o => o.paymentStatus !== "Paid").reduce((s, o) => s + o.total, 0);
    return { total, pending, count: ORDERS.length, delivered: ORDERS.filter(o => o.status === "Delivered").length };
  }, []);

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description={`${ORDERS.length} orders · ${formatINR(summary.total, { decimals: false })} total value`}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Export CSV</Button>
            <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" asChild>
              <Link to="/admin/pos"><ScanLine className="w-4 h-4 mr-1.5" /> New Sale</Link>
            </Button>
          </>
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
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1.5" /> Date range</Button>
        </div>
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
          {(["All", "Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === s ? "bg-primary text-primary-foreground shadow-elegant" : "bg-white/50 text-muted-foreground hover:bg-white/80"
              )}
            >{s}</button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
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
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-white/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono text-xs font-bold text-primary">{o.id}</div>
                    <div className="text-[10px] text-muted-foreground">{o.items} items</div>
                  </td>
                  <td className="py-3">
                    <div className="font-medium">{o.customer}</div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground hidden md:table-cell">{o.date}</td>
                  <td className="py-3 hidden lg:table-cell">
                    <Badge variant="outline" className="text-[10px] font-medium">{o.channel}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="font-display font-bold">{formatINR(o.total, { decimals: false })}</div>
                    <div className="text-[10px] text-muted-foreground">+{formatINR(o.tax, { decimals: false })} tax</div>
                  </td>
                  <td className="py-3 hidden sm:table-cell">
                    <Badge className={cn("border-0 text-[10px]", PAY_STYLES[o.paymentStatus])}>
                      {o.payment} · {o.paymentStatus}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className={cn("font-medium border", STATUS_STYLES[o.status])}>
                      {o.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No orders match your filters</p>
          </div>
        )}
      </Card>
    </div>
  );
}
