import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, ShoppingCart, IndianRupee,
  AlertTriangle, Wallet, Plus, ArrowRight, ScanLine, UserPlus,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Link } from "react-router-dom";
import { KPIS, SALES_TREND, TOP_PRODUCTS, RECENT_ORDERS, PRODUCTS } from "@/data/mockData";
import { formatINR, formatCompactINR, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Delivered: "bg-success/10 text-success border-success/20",
  Confirmed: "bg-primary/10 text-primary border-primary/20",
  Packed: "bg-warning/15 text-warning-foreground border-warning/30",
  Pending: "bg-muted text-muted-foreground border-border",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const KpiCard = ({
  label, value, change, icon: Icon, trend, accent,
}: {
  label: string; value: string; change?: string;
  icon: any; trend?: "up" | "down"; accent?: boolean;
}) => (
  <Card className={cn(
    "p-5 relative overflow-hidden border-border/60 hover:shadow-elegant transition-shadow",
    accent && "gradient-primary text-primary-foreground border-transparent"
  )}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className={cn("text-xs font-medium uppercase tracking-wide", accent ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {label}
        </div>
        <div className="font-display font-bold text-2xl mt-1.5">{value}</div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium",
            trend === "up" ? (accent ? "text-accent-glow" : "text-success") : "text-destructive"
          )}>
            {trend === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change}
          </div>
        )}
      </div>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
        accent ? "bg-white/15" : "bg-primary/10 text-primary"
      )}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    {accent && (
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-accent/20 blur-2xl" />
    )}
  </Card>
);

export default function Dashboard() {
  const lowStock = PRODUCTS.filter(p => p.stock <= p.lowStockAlert);

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground">
            Namaste, Rajesh 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's how Sharma General Store is doing today
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/parties"><UserPlus className="w-4 h-4 mr-1.5" />New Party</Link>
          </Button>
          <Button size="sm" className="gradient-accent border-0 shadow-glow" asChild>
            <Link to="/admin/pos"><ScanLine className="w-4 h-4 mr-1.5" />New Sale</Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Today's Sales" value={formatINR(KPIS.todaySales)} change="+12.4% vs yesterday" trend="up" icon={IndianRupee} accent />
        <KpiCard label="Today's Orders" value={formatNumber(KPIS.todayOrders)} change="+8 orders" trend="up" icon={ShoppingCart} />
        <KpiCard label="Pending Dues" value={formatINR(KPIS.pendingDues)} change="3 customers" icon={Wallet} />
        <KpiCard label="Low Stock Alerts" value={formatNumber(KPIS.lowStockCount)} change="Reorder needed" trend="down" icon={AlertTriangle} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-lg">Sales Overview</h2>
              <p className="text-xs text-muted-foreground">Last 14 days · Total {formatCompactINR(SALES_TREND.reduce((s, d) => s + d.sales, 0))}</p>
            </div>
            <div className="flex gap-1 text-xs">
              <Button variant="ghost" size="sm" className="h-7 px-2.5">7D</Button>
              <Button variant="secondary" size="sm" className="h-7 px-2.5">14D</Button>
              <Button variant="ghost" size="sm" className="h-7 px-2.5">30D</Button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_TREND} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatINR(v), "Sales"]}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display font-semibold text-lg mb-1">Top Products</h2>
          <p className="text-xs text-muted-foreground mb-4">This week</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={95} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="sold" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent orders + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Recent Orders</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders" className="text-xs">View all <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </div>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-y border-border">
                <tr>
                  <th className="text-left font-medium py-2.5 px-5">Order</th>
                  <th className="text-left font-medium py-2.5">Customer</th>
                  <th className="text-right font-medium py-2.5">Total</th>
                  <th className="text-left font-medium py-2.5 hidden md:table-cell">Status</th>
                  <th className="text-right font-medium py-2.5 px-5 hidden sm:table-cell">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT_ORDERS.map(o => (
                  <tr key={o.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-semibold text-primary">{o.id}</td>
                    <td className="py-3">
                      <div className="font-medium">{o.customer}</div>
                      <div className="text-xs text-muted-foreground">{o.items} items · {o.payment}</div>
                    </td>
                    <td className="py-3 text-right font-display font-semibold">{formatINR(o.total, { decimals: false })}</td>
                    <td className="py-3 hidden md:table-cell">
                      <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[o.status])}>
                        {o.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-5 text-right text-xs text-muted-foreground hidden sm:table-cell">{o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-lg">Low Stock</h2>
              <p className="text-xs text-muted-foreground">Reorder soon</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-warning/15 text-warning-foreground flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-3">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-md object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.sku}</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-destructive">{p.stock}</div>
                  <div className="text-[10px] text-muted-foreground">/ {p.lowStockAlert} min</div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-2">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Quick Reorder
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
