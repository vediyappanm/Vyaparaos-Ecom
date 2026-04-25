import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShoppingBag, Boxes, Users, Receipt, Wallet, Download, ArrowRight, Loader2 } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useOrders } from "@/hooks/useOrders";
import { formatINR, formatCompactINR } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";

const REPORTS = [
  { icon: TrendingUp, title: "Sales Report", desc: "Date-wise & product-wise sales", color: "from-violet-500 to-purple-600" },
  { icon: ShoppingBag, title: "Purchase Report", desc: "Vendor-wise purchase summary", color: "from-blue-500 to-indigo-600" },
  { icon: Boxes, title: "Inventory Report", desc: "Current stock and valuation", color: "from-emerald-500 to-teal-600" },
  { icon: Receipt, title: "GST Report", desc: "GSTR-1, GSTR-3B breakup", color: "from-amber-500 to-orange-500" },
  { icon: Users, title: "Party Ledger", desc: "Customer & vendor balances", color: "from-pink-500 to-rose-600" },
  { icon: Wallet, title: "P&L Statement", desc: "Revenue, expenses, profit", color: "from-yellow-500 to-amber-500" },
];

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
  const { data: orders = [] } = useOrders(500);

  const exportSales = () => {
    csvDownload("sales-report.csv", orders.map((o: any) => ({
      order_number: o.order_number, date: new Date(o.created_at).toLocaleDateString("en-IN"),
      customer: o.party_name ?? "Walk-in", channel: o.channel, total: o.total, tax: o.tax_amount,
      payment: o.payment_mode, status: o.status,
    })));
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="Insights" title="Reports" description="Export your business data as CSV"
        actions={<Button variant="outline" size="sm" onClick={exportSales}><Download className="w-4 h-4 mr-1.5" /> Export Sales</Button>} />

      {dash && (
        <Card className="p-5">
          <h2 className="font-display font-bold text-xl">Snapshot</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">14-day Sales</div>
              <div className="font-display font-bold text-lg text-success">{formatCompactINR(dash.salesTrend.reduce((s, d) => s + d.sales, 0))}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending Dues</div>
              <div className="font-display font-bold text-lg text-destructive">{formatCompactINR(dash.kpis.pendingDues)}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Orders</div>
              <div className="font-display font-bold text-lg">{dash.kpis.totalOrders}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Low Stock SKUs</div>
              <div className="font-display font-bold text-lg text-warning-foreground">{dash.kpis.lowStockCount}</div></div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map(r => (
          <Card key={r.title} className="p-5 group hover:shadow-elevated transition-all cursor-pointer" onClick={exportSales}>
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
              <r.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-display font-semibold mt-3">{r.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary group-hover:text-accent">Download CSV <ArrowRight className="w-3 h-3" /></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
