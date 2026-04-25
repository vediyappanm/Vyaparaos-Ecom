import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, ShoppingCart, IndianRupee, AlertTriangle, Wallet, Plus, ArrowRight, ScanLine, UserPlus, Loader2, Activity, Boxes,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line, LineChart } from "recharts";
import { Link } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { useTenant } from "@/contexts/TenantContext";
import { formatINR, formatCompactINR, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-success/10 text-success border-success/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  packed: "bg-warning/15 text-warning-foreground border-warning/30",
  pending: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  shipped: "bg-blue-500/10 text-blue-700 border-blue-500/20",
};

const KpiCard = ({ label, value, icon: Icon, accent, sub, delta, sparkline }: any) => {
  const positive = typeof delta === "number" ? delta >= 0 : null;
  return (
    <Card className={cn("p-5 relative overflow-hidden border-border/60 group", accent && "gradient-primary text-primary-foreground border-transparent")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className={cn("text-[11px] font-semibold uppercase tracking-wider", accent ? "text-primary-foreground/70" : "text-muted-foreground")}>{label}</div>
          <div className="font-display font-bold text-2xl mt-1.5 tabular-nums">{value}</div>
          <div className="flex items-center gap-2 mt-1.5">
            {typeof delta === "number" && (
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
                positive ? (accent ? "bg-success/30 text-white" : "bg-success/15 text-success") : (accent ? "bg-destructive/30 text-white" : "bg-destructive/15 text-destructive"),
              )}>
                {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(delta).toFixed(0)}%
              </span>
            )}
            {sub && <span className={cn("text-xs", accent ? "text-accent-glow" : "text-muted-foreground")}>{sub}</span>}
          </div>
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", accent ? "bg-white/15" : "bg-primary/10 text-primary")}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 h-12 opacity-70 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="sales" stroke={accent ? "hsl(var(--accent-glow))" : "hsl(var(--primary))"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {accent && <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-accent/20 blur-2xl" />}
    </Card>
  );
};

const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - +new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function Dashboard() {
  const { tenant, role } = useTenant();
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></div>;
  const { kpis, salesTrend, topProducts, lowStock, recentOrders, activity } = data;

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live · synced across devices
          </div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground mt-1">Namaste 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's how <span className="font-semibold text-foreground">{tenant?.name}</span> is doing today</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/admin/parties"><UserPlus className="w-4 h-4 mr-1.5" />New Party</Link></Button>
          <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" asChild>
            <Link to="/admin/pos"><ScanLine className="w-4 h-4 mr-1.5" />New Sale</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Today's Sales" value={formatINR(kpis.todaySales, { decimals: false })}
          sub={`${kpis.todayOrders} orders · vs ${formatCompactINR(kpis.ydaySales)} yday`}
          delta={kpis.salesDelta} icon={IndianRupee} accent sparkline={salesTrend.slice(-7)} />
        <KpiCard label="Total Orders" value={formatNumber(kpis.totalOrders)} sub="Last 30 days" icon={ShoppingCart} />
        <KpiCard label="Pending Dues" value={formatINR(kpis.pendingDues, { decimals: false })} sub="Receivable" icon={Wallet} />
        {(role === "owner" || role === "manager") ? (
          <KpiCard label="Inventory Value" value={formatCompactINR(kpis.inventoryValue)} sub={`${kpis.lowStockCount} low-stock`} icon={Boxes} />
        ) : (
          <KpiCard label="Low Stock" value={formatNumber(kpis.lowStockCount)} sub="Reorder soon" icon={AlertTriangle} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-lg">Sales Overview</h2>
              <p className="text-xs text-muted-foreground">Last 14 days · Total {formatCompactINR(salesTrend.reduce((s, d) => s + d.sales, 0))}</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatINR(v), "Sales"]} />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display font-semibold text-lg mb-3">Top Products</h2>
          {topProducts.length === 0 ? <p className="text-xs text-muted-foreground py-12 text-center">No sales yet</p> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={95} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [formatINR(v), "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Recent Orders</h2>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/orders" className="text-xs">View all <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
          </div>
          {recentOrders.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No orders yet — make your first sale!</p> : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-y border-border">
                <tr><th className="text-left font-medium py-2.5">Order</th><th className="text-left font-medium py-2.5">Customer</th>
                <th className="text-right font-medium py-2.5">Total</th><th className="text-left font-medium py-2.5 hidden md:table-cell">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-muted/40">
                    <td className="py-3 font-mono text-xs font-semibold text-primary">{o.order_number}</td>
                    <td className="py-3"><div className="font-medium">{o.party_name ?? "Walk-in"}</div>
                      <div className="text-xs text-muted-foreground">{o.payment_mode}</div></td>
                    <td className="py-3 text-right font-display font-semibold tabular-nums">{formatINR(Number(o.total), { decimals: false })}</td>
                    <td className="py-3 hidden md:table-cell"><Badge variant="outline" className={cn("font-medium capitalize", STATUS_STYLES[o.status])}>{o.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /><h2 className="font-display font-semibold text-lg">Live Activity</h2></div>
          </div>
          {activity.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">No recent activity</p> : (
            <div className="space-y-2.5">
              {activity.map((a: any) => (
                <div key={`${a.kind}-${a.id}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    a.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {a.kind === "order" ? <ShoppingCart className="w-3.5 h-3.5" /> : a.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-[10px] text-muted-foreground">{timeAgo(a.ts)} · <span className="capitalize">{a.status}</span></div>
                  </div>
                  <div className={cn("text-sm font-semibold tabular-nums", a.positive ? "text-success" : "text-destructive")}>
                    {a.positive ? "+" : "−"}{formatCompactINR(a.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="p-5 border-warning/30 bg-warning/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
              <div>
                <h2 className="font-display font-semibold text-lg">Low Stock Alert</h2>
                <p className="text-xs text-muted-foreground">{lowStock.length} item{lowStock.length > 1 ? "s" : ""} need restocking</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild><Link to="/admin/inventory"><Plus className="w-3.5 h-3.5 mr-1.5" />Adjust Stock</Link></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {lowStock.slice(0, 6).map((p: any) => (
              <div key={p.id} className="p-3 rounded-lg bg-card border border-border/60">
                <div className="text-xs font-medium truncate">{p.name}</div>
                <div className="text-[10px] text-muted-foreground truncate font-mono">{p.sku ?? "—"}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display font-bold text-destructive tabular-nums">{p.stock_qty}</span>
                  <span className="text-[10px] text-muted-foreground">/ {p.low_stock_alert} min</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
