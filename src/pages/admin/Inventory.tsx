import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Boxes, Search, Plus, Download, TrendingDown, TrendingUp, Package } from "lucide-react";
import { PRODUCTS, STOCK_MOVEMENTS } from "@/data/mockData";
import { formatINR, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";

const MOVE_STYLES: Record<string, string> = {
  Purchase: "bg-success/10 text-success",
  Sale: "bg-primary/10 text-primary",
  Adjustment: "bg-warning/15 text-warning-foreground",
  Return: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Damage: "bg-destructive/10 text-destructive",
};

export default function Inventory() {
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const totalUnits = PRODUCTS.reduce((s, p) => s + p.stock, 0);
    const totalValue = PRODUCTS.reduce((s, p) => s + p.stock * p.purchasePrice, 0);
    const lowStock = PRODUCTS.filter(p => p.stock <= p.lowStockAlert);
    const outOfStock = PRODUCTS.filter(p => p.stock === 0);
    return { totalUnits, totalValue, lowStock, outOfStock };
  }, []);

  const filtered = PRODUCTS.filter(p =>
    !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Stock control"
        title="Inventory"
        description="Real-time stock levels, movements, low-stock alerts and adjustments"
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
            <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground">
              <Plus className="w-4 h-4 mr-1.5" /> Stock Adjustment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 gradient-royal text-white border-0 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-accent/30 blur-2xl" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Stock Value</div>
            <div className="font-display font-bold text-2xl mt-1">{formatINR(stats.totalValue, { decimals: false })}</div>
            <div className="text-[11px] text-white/70">at purchase price</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Units</div>
          <div className="font-display font-bold text-2xl mt-1">{formatNumber(stats.totalUnits)}</div>
          <div className="text-[11px] text-muted-foreground">across {PRODUCTS.length} SKUs</div>
        </Card>
        <Card className="p-4 border-warning/30">
          <div className="text-[10px] uppercase tracking-wider text-warning-foreground font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Low Stock
          </div>
          <div className="font-display font-bold text-2xl mt-1 text-warning-foreground">{stats.lowStock.length}</div>
          <div className="text-[11px] text-muted-foreground">reorder soon</div>
        </Card>
        <Card className="p-4 border-destructive/30">
          <div className="text-[10px] uppercase tracking-wider text-destructive font-semibold">Out of Stock</div>
          <div className="font-display font-bold text-2xl mt-1 text-destructive">{stats.outOfStock.length}</div>
          <div className="text-[11px] text-muted-foreground">unavailable</div>
        </Card>
      </div>

      {/* Low stock callout */}
      {stats.lowStock.length > 0 && (
        <Card className="p-4 border-warning/40 bg-warning/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold">Reorder needed for {stats.lowStock.length} products</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {stats.lowStock.map(p => (
                  <Badge key={p.id} variant="outline" className="bg-white/60">
                    {p.name} · {p.stock} {p.unit} left
                  </Badge>
                ))}
              </div>
            </div>
            <Button size="sm" className="gradient-accent border-0 text-accent-foreground">Quick Reorder</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock list */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-lg">Stock Levels</h2>
            <div className="relative w-64 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="pl-9 h-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase text-muted-foreground bg-white/30">
                <tr>
                  <th className="text-left font-semibold py-2.5 px-4">Product</th>
                  <th className="text-right font-semibold py-2.5">In Stock</th>
                  <th className="text-right font-semibold py-2.5">Min</th>
                  <th className="text-right font-semibold py-2.5 px-4 hidden sm:table-cell">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map(p => {
                  const status = p.stock === 0 ? "out" : p.stock <= p.lowStockAlert ? "low" : "ok";
                  const pct = Math.min(100, (p.stock / Math.max(p.lowStockAlert * 3, 1)) * 100);
                  return (
                    <tr key={p.id} className="hover:bg-white/40">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img src={p.image} alt="" className="w-9 h-9 rounded object-cover" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{p.sku}</div>
                            <div className="mt-1 h-1 w-32 max-w-full bg-muted rounded overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded",
                                  status === "out" ? "bg-destructive" : status === "low" ? "bg-warning" : "bg-success"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className={cn(
                          "font-display font-bold",
                          status === "out" && "text-destructive",
                          status === "low" && "text-warning-foreground",
                          status === "ok" && "text-foreground"
                        )}>
                          {p.stock}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{p.unit}</div>
                      </td>
                      <td className="py-2.5 text-right text-xs text-muted-foreground">{p.lowStockAlert}</td>
                      <td className="py-2.5 px-4 text-right hidden sm:table-cell font-mono text-xs">
                        {formatINR(p.stock * p.purchasePrice, { decimals: false })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Stock movements */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-display font-semibold text-lg">Recent Movements</h2>
            <p className="text-xs text-muted-foreground">Last 8 transactions</p>
          </div>
          <div className="divide-y divide-border/60 max-h-[480px] overflow-y-auto">
            {STOCK_MOVEMENTS.map(m => (
              <div key={m.id} className="p-3 hover:bg-white/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.product}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{m.reference} · {m.date}</div>
                    {m.notes && <div className="text-[10px] text-muted-foreground mt-0.5 italic">{m.notes}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={cn("text-[10px] border-0", MOVE_STYLES[m.type])}>{m.type}</Badge>
                    <div className={cn(
                      "font-mono font-bold text-sm mt-1 flex items-center gap-0.5 justify-end",
                      m.qty > 0 ? "text-success" : "text-destructive"
                    )}>
                      {m.qty > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {m.qty > 0 ? "+" : ""}{m.qty}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
