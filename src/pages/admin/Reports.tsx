import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, Receipt, Wallet, Boxes, Loader2 } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useOrders } from "@/hooks/useOrders";
import { useTransactions } from "@/hooks/useFinance";
import { useProducts } from "@/hooks/useProducts";
import { usePurchases } from "@/hooks/usePurchases";
import { formatINR, formatCompactINR } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

const csvDownload = (filename: string, rows: any[]) => {
  if (!rows.length) return toast.error("No data to export");
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} downloaded`);
};

export default function Reports() {
  const { data: dash } = useDashboard();
  const { data: orders = [] } = useOrders(1000);
  const { data: products = [] } = useProducts();
  const { data: purchases = [] } = usePurchases();
  const { data: txns = [] } = useTransactions(500);
  const [tab, setTab] = useState("sales");

  // ---- Sales analytics ----
  const salesByChannel = useMemo(() => {
    const m: Record<string, number> = {};
    orders.forEach((o: any) => { m[o.channel ?? "pos"] = (m[o.channel ?? "pos"] ?? 0) + Number(o.total); });
    return Object.entries(m).map(([channel, total]) => ({ channel, total }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const m: Record<string, { name: string; qty: number; total: number }> = {};
    orders.forEach((o: any) => (o.items ?? []).forEach((it: any) => {
      const k = it.product_id ?? it.product_name;
      m[k] = m[k] ?? { name: it.product_name, qty: 0, total: 0 };
      m[k].qty += Number(it.qty); m[k].total += Number(it.total);
    }));
    return Object.values(m).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [orders]);

  // ---- P&L ----
  const pnl = useMemo(() => {
    const revenue = orders.reduce((s, o: any) => s + Number(o.total) - Number(o.tax_amount ?? 0), 0);
    const cogs = orders.reduce((s, o: any) => s + (o.items ?? []).reduce((x: number, it: any) => {
      const p = products.find(pr => pr.id === it.product_id);
      return x + (p ? Number(p.cost_price) * Number(it.qty) : 0);
    }, 0), 0);
    const expenses = (txns ?? []).filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const otherIncome = (txns ?? []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit + otherIncome - expenses;
    return { revenue, cogs, grossProfit, expenses, otherIncome, netProfit };
  }, [orders, products, txns]);

  // ---- GST: GSTR-1 like summary by HSN+rate ----
  const gstSummary = useMemo(() => {
    const m: Record<string, { hsn: string; rate: number; taxable: number; cgst: number; sgst: number; total_tax: number }> = {};
    orders.forEach((o: any) => (o.items ?? []).forEach((it: any) => {
      const k = `${it.hsn_code ?? "—"}-${it.tax_rate}`;
      const tax = Number(it.tax_amount);
      m[k] = m[k] ?? { hsn: it.hsn_code ?? "—", rate: Number(it.tax_rate), taxable: 0, cgst: 0, sgst: 0, total_tax: 0 };
      m[k].taxable += Number(it.total) - tax;
      m[k].cgst += tax / 2; m[k].sgst += tax / 2; m[k].total_tax += tax;
    }));
    return Object.values(m).sort((a, b) => b.total_tax - a.total_tax);
  }, [orders]);

  const exportSales = () => csvDownload("sales-report.csv", orders.map((o: any) => ({
    order_number: o.order_number, date: new Date(o.created_at).toLocaleDateString("en-IN"),
    customer: o.party_name ?? "Walk-in", channel: o.channel, subtotal: o.subtotal, tax: o.tax_amount,
    total: o.total, payment: o.payment_mode, payment_status: o.payment_status, status: o.status,
  })));
  const exportGst = () => csvDownload("gstr1-summary.csv", gstSummary);
  const exportPnL = () => csvDownload("profit-loss.csv", [
    { line: "Revenue (excl. tax)", amount: pnl.revenue },
    { line: "Cost of goods sold", amount: pnl.cogs },
    { line: "Gross profit", amount: pnl.grossProfit },
    { line: "Other income", amount: pnl.otherIncome },
    { line: "Operating expenses", amount: pnl.expenses },
    { line: "Net profit", amount: pnl.netProfit },
  ]);
  const exportInventory = () => csvDownload("inventory-valuation.csv", products.map(p => ({
    name: p.name, sku: p.sku, category: p.category, stock: p.stock_qty, unit: p.unit,
    cost_price: p.cost_price, value: Number(p.cost_price) * Number(p.stock_qty),
  })));
  const exportPurchases = () => csvDownload("purchases.csv", purchases.map((p: any) => ({
    purchase_number: p.purchase_number, date: p.purchase_date, vendor: p.vendor_name, total: p.total, paid: p.paid_amount,
  })));

  if (!dash) return <div className="p-12 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>;

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="Insights" title="Reports" description="Real-time business intelligence — exportable to CSV" />

      {/* Snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Net Profit (period)" value={formatCompactINR(pnl.netProfit)} positive={pnl.netProfit >= 0} icon={Wallet} />
        <KpiCard title="Revenue" value={formatCompactINR(pnl.revenue)} positive icon={TrendingUp} />
        <KpiCard title="GST Collected" value={formatCompactINR(orders.reduce((s, o: any) => s + Number(o.tax_amount), 0))} positive icon={Receipt} />
        <KpiCard title="Inventory Value" value={formatCompactINR(products.reduce((s, p) => s + Number(p.cost_price) * Number(p.stock_qty), 0))} positive icon={Boxes} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4 mt-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-base">14-day sales trend</h2>
              <Button variant="outline" size="sm" onClick={exportSales}><Download className="w-3.5 h-3.5 mr-1" />Export sales</Button>
            </div>
            <div className="h-60">
              <ResponsiveContainer>
                <AreaChart data={dash.salesTrend}>
                  <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} tickFormatter={(v) => formatCompactINR(v as number)} />
                  <Tooltip formatter={(v) => formatINR(v as number)} />
                  <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-display font-semibold text-sm mb-3">Sales by channel</h3>
              <div className="h-48">
                <ResponsiveContainer>
                  <BarChart data={salesByChannel}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="channel" fontSize={10} />
                    <YAxis fontSize={10} tickFormatter={(v) => formatCompactINR(v as number)} />
                    <Tooltip formatter={(v) => formatINR(v as number)} />
                    <Bar dataKey="total" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-display font-semibold text-sm mb-3">Top 10 products</h3>
              <ul className="text-sm divide-y">
                {topProducts.length === 0 && <li className="py-3 text-muted-foreground text-xs">No sales yet</li>}
                {topProducts.map((p, i) => (
                  <li key={i} className="py-2 flex items-center justify-between">
                    <span className="truncate flex-1">{i + 1}. {p.name} <span className="text-muted-foreground text-xs">× {p.qty}</span></span>
                    <span className="font-semibold tabular-nums">{formatINR(p.total)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pnl" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-base">Profit & Loss Statement</h2>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportPnL}><Download className="w-3.5 h-3.5 mr-1" />Export</Button>
            </div>
            <div className="space-y-2">
              <PnlRow label="Revenue (excl. tax)" amount={pnl.revenue} />
              <PnlRow label="Cost of Goods Sold" amount={-pnl.cogs} />
              <PnlRow label="Gross Profit" amount={pnl.grossProfit} bold />
              <PnlRow label="Other Income" amount={pnl.otherIncome} />
              <PnlRow label="Operating Expenses" amount={-pnl.expenses} />
              <div className="border-t pt-3 mt-2">
                <PnlRow label="NET PROFIT" amount={pnl.netProfit} bold large />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="gst" className="space-y-4 mt-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display font-bold text-base">GSTR-1 Summary (HSN-wise)</h2>
                <p className="text-xs text-muted-foreground">Aggregated from invoices</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportGst}><Download className="w-3.5 h-3.5 mr-1" />Export GSTR-1</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs text-muted-foreground"><tr>
                  <th className="text-left py-2">HSN</th><th className="text-right">Rate</th><th className="text-right">Taxable</th>
                  <th className="text-right">CGST</th><th className="text-right">SGST</th><th className="text-right">Total Tax</th>
                </tr></thead>
                <tbody>
                  {gstSummary.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">No taxable sales yet</td></tr> :
                    gstSummary.map((r, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 font-mono">{r.hsn}</td>
                        <td className="text-right">{r.rate}%</td>
                        <td className="text-right tabular-nums">{formatINR(r.taxable)}</td>
                        <td className="text-right tabular-nums">{formatINR(r.cgst)}</td>
                        <td className="text-right tabular-nums">{formatINR(r.sgst)}</td>
                        <td className="text-right tabular-nums font-semibold">{formatINR(r.total_tax)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-base">Inventory Valuation</h2>
              <Button variant="outline" size="sm" onClick={exportInventory}><Download className="w-3.5 h-3.5 mr-1" />Export</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs text-muted-foreground"><tr>
                  <th className="text-left py-2">Product</th><th className="text-right">Stock</th>
                  <th className="text-right">Cost</th><th className="text-right">Value</th><th className="text-right">Status</th>
                </tr></thead>
                <tbody>
                  {products.map(p => {
                    const value = Number(p.cost_price) * Number(p.stock_qty);
                    const low = Number(p.stock_qty) <= Number(p.low_stock_alert);
                    return (
                      <tr key={p.id} className="border-b">
                        <td className="py-2">{p.name} <span className="text-xs text-muted-foreground">{p.sku}</span></td>
                        <td className="text-right tabular-nums">{p.stock_qty} {p.unit}</td>
                        <td className="text-right tabular-nums">{formatINR(Number(p.cost_price))}</td>
                        <td className="text-right tabular-nums font-semibold">{formatINR(value)}</td>
                        <td className="text-right">{low && <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/30 text-[10px]">Low</Badge>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-base">Purchase Report</h2>
              <Button variant="outline" size="sm" onClick={exportPurchases}><Download className="w-3.5 h-3.5 mr-1" />Export</Button>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b text-xs text-muted-foreground"><tr>
                <th className="text-left py-2">PO #</th><th className="text-left">Vendor</th>
                <th className="text-left">Date</th><th className="text-right">Total</th><th className="text-right">Paid</th>
              </tr></thead>
              <tbody>
                {purchases.length === 0 ? <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No purchases recorded</td></tr> :
                  purchases.map((p: any) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2 font-mono">{p.purchase_number}</td>
                      <td>{p.vendor_name}</td>
                      <td>{new Date(p.purchase_date).toLocaleDateString("en-IN")}</td>
                      <td className="text-right tabular-nums">{formatINR(Number(p.total))}</td>
                      <td className="text-right tabular-nums">{formatINR(Number(p.paid_amount))}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ title, value, positive, icon: Icon }: { title: string; value: string; positive: boolean; icon: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{title}</div>
          <div className={`font-display font-bold text-xl mt-1 ${positive ? "text-success" : "text-destructive"}`}>{value}</div>
        </div>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
    </Card>
  );
}

function PnlRow({ label, amount, bold, large }: { label: string; amount: number; bold?: boolean; large?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-bold" : ""} ${large ? "text-lg" : "text-sm"}`}>
      <span>{label}</span>
      <span className={`tabular-nums ${amount < 0 ? "text-destructive" : ""}`}>{formatINR(amount)}</span>
    </div>
  );
}
