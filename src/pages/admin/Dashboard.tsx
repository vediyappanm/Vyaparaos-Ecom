import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, ShoppingCart, IndianRupee, AlertTriangle, Wallet,
  ArrowRight, ScanLine, UserPlus, Loader2, Activity, Boxes, PackagePlus,
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

const StatCard = ({ label, value, icon: Icon, sub, delta, tone = "default", sparkline }: any) => {
  const positive = typeof delta === "number" ? delta >= 0 : null;
  const featured = tone === "featured";

  return (
    <Card className={cn(
      "relative overflow-hidden p-4 shadow-sm transition-shadow hover:shadow-elegant",
      featured ? "gradient-primary border-transparent text-primary-foreground" : "border-border/80 bg-card"
    )}>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className={cn("text-[11px] font-bold uppercase tracking-[0.12em]", featured ? "text-white/62" : "text-muted-foreground")}>{label}</div>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums">{value}</div>
          <div className="mt-2 flex min-h-5 items-center gap-2">
            {positive !== null && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold",
                positive
                  ? featured ? "bg-white/12 text-white" : "bg-success/10 text-success"
                  : featured ? "bg-white/12 text-white" : "bg-destructive/10 text-destructive",
              )}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(delta).toFixed(0)}%
              </span>
            )}
            {sub && <span className={cn("truncate text-xs", featured ? "text-white/70" : "text-muted-foreground")}>{sub}</span>}
          </div>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", featured ? "bg-white/12" : "bg-primary/[0.08] text-primary")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {sparkline?.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 h-12 opacity-55">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="sales" stroke={featured ? "hsl(var(--accent-glow))" : "hsl(var(--primary))"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

const timeAgo = (iso: string) => {
  const minutes = Math.floor((Date.now() - +new Date(iso)) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
    <div className="font-medium text-foreground">{title}</div>
    <div className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</div>
  </div>
);

export default function Dashboard() {
  const { tenant, role } = useTenant();
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const { kpis, salesTrend, topProducts, lowStock, recentOrders, activity } = data;
  const isManager = role === "owner" || role === "manager";
  const totalTrendSales = salesTrend.reduce((sum, day) => sum + day.sales, 0);

  return (
    <div className="space-y-5 px-4 py-5 animate-fade-in lg:px-6">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-success" />
              Live workspace
              <span className="text-border">/</span>
              <span className="truncate">{tenant?.name}</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-foreground lg:text-[2rem]">Today&apos;s command center</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track sales, dues, inventory pressure, and recent movement from one focused screen.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" className="h-10 justify-center gap-2 bg-background" asChild>
              <Link to="/admin/parties"><UserPlus className="h-4 w-4" /> New Party</Link>
            </Button>
            <Button variant="outline" className="h-10 justify-center gap-2 bg-background" asChild>
              <Link to="/admin/products"><PackagePlus className="h-4 w-4" /> Add Product</Link>
            </Button>
            <Button className="col-span-2 h-10 justify-center gap-2 gradient-accent text-accent-foreground shadow-glow sm:col-span-1" asChild>
              <Link to="/admin/pos"><ScanLine className="h-4 w-4" /> New Sale</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={formatINR(kpis.todaySales, { decimals: false })}
          sub={`${kpis.todayOrders} orders vs ${formatCompactINR(kpis.ydaySales)} yesterday`}
          delta={kpis.salesDelta}
          icon={IndianRupee}
          tone="featured"
          sparkline={salesTrend.slice(-7)}
        />
        <StatCard label="Total Orders" value={formatNumber(kpis.totalOrders)} sub="Last 30 days" icon={ShoppingCart} />
        <StatCard label="Pending Dues" value={formatINR(kpis.pendingDues, { decimals: false })} sub="Receivable balance" icon={Wallet} />
        {isManager ? (
          <StatCard label="Inventory Value" value={formatCompactINR(kpis.inventoryValue)} sub={`${kpis.lowStockCount} low-stock items`} icon={Boxes} />
        ) : (
          <StatCard label="Low Stock" value={formatNumber(kpis.lowStockCount)} sub="Needs reorder" icon={AlertTriangle} />
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-4 shadow-sm xl:col-span-2 lg:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Sales Overview</h2>
              <p className="text-xs text-muted-foreground">Last 14 days total: {formatCompactINR(totalTrendSales)}</p>
            </div>
            <Badge variant="outline" className="bg-muted/60 text-xs">14 days</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactINR(Number(v))} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [formatINR(value), "Sales"]}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 shadow-sm lg:p-5">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Top Products</h2>
            <p className="text-xs text-muted-foreground">Revenue leaders from recent sales</p>
          </div>
          {topProducts.length === 0 ? (
            <EmptyState title="No sales yet" description="Top products will appear here after your first few orders." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactINR(Number(v))} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={98} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [formatINR(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-4 shadow-sm xl:col-span-2 lg:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
              <p className="text-xs text-muted-foreground">Latest customer and POS activity</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders" className="text-xs">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" description="Create a sale from POS and the order history will start filling in." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold">Order</th>
                    <th className="px-3 py-3 text-left font-semibold">Customer</th>
                    <th className="px-3 py-3 text-right font-semibold">Total</th>
                    <th className="hidden px-3 py-3 text-left font-semibold md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-3 py-3 font-mono text-xs font-semibold text-primary">{order.order_number}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{order.party_name ?? "Walk-in"}</div>
                        <div className="text-xs text-muted-foreground">{order.payment_mode ?? order.channel ?? "POS"}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-display font-semibold tabular-nums">{formatINR(Number(order.total), { decimals: false })}</td>
                      <td className="hidden px-3 py-3 md:table-cell">
                        <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[order.status] ?? STATUS_STYLES.pending)}>{order.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-4 shadow-sm lg:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Live Activity</h2>
              <p className="text-xs text-muted-foreground">Orders and cash movement</p>
            </div>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          {activity.length === 0 ? (
            <EmptyState title="Quiet for now" description="Recent orders and finance entries will show up here." />
          ) : (
            <div className="space-y-2">
              {activity.map((item: any) => (
                <div key={`${item.kind}-${item.id}`} className="flex items-start gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/35">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", item.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {item.kind === "order" ? <ShoppingCart className="h-3.5 w-3.5" /> : item.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.title}</div>
                    <div className="text-[10px] capitalize text-muted-foreground">{timeAgo(item.ts)} / {item.status}</div>
                  </div>
                  <div className={cn("text-sm font-bold tabular-nums", item.positive ? "text-success" : "text-destructive")}>
                    {item.positive ? "+" : "-"}{formatCompactINR(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {lowStock.length > 0 && (
        <Card className="border-warning/30 bg-warning/5 p-4 shadow-sm lg:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Low Stock Alert</h2>
                <p className="text-xs text-muted-foreground">{lowStock.length} item{lowStock.length > 1 ? "s" : ""} need restocking soon</p>
              </div>
            </div>
            <Button variant="outline" className="bg-card" size="sm" asChild>
              <Link to="/admin/inventory">Open Inventory <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {lowStock.slice(0, 6).map((product: any) => (
              <div key={product.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                <div className="truncate text-xs font-semibold">{product.name}</div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{product.sku ?? "No SKU"}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-xl font-bold text-destructive tabular-nums">{product.stock_qty}</span>
                  <span className="text-[10px] text-muted-foreground">/ {product.low_stock_alert} min</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
