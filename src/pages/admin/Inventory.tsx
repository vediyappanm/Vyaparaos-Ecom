import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, Plus, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { formatINR, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { StockAdjustmentDialog } from "@/components/admin/StockAdjustmentDialog";

const MOVE_STYLES: Record<string, string> = {
  purchase: "bg-success/10 text-success", sale: "bg-primary/10 text-primary",
  adjustment: "bg-warning/15 text-warning-foreground", return: "bg-blue-500/10 text-blue-700",
  damage: "bg-destructive/10 text-destructive",
};

export default function Inventory() {
  const { data: products = [], isLoading } = useProducts();
  const { data: movements = [] } = useStockMovements(20);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const totalUnits = products.reduce((s, p) => s + Number(p.stock_qty), 0);
    const totalValue = products.reduce((s, p) => s + Number(p.stock_qty) * Number(p.cost_price), 0);
    const lowStock = products.filter(p => Number(p.stock_qty) <= Number(p.low_stock_alert));
    const outOfStock = products.filter(p => Number(p.stock_qty) === 0);
    return { totalUnits, totalValue, lowStock, outOfStock };
  }, [products]);

  const filtered = products.filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="Stock control" title="Inventory" description="Real-time stock levels, movements and adjustments"
        actions={<Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Stock Adjustment</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 gradient-royal text-white border-0">
          <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Stock Value</div>
          <div className="font-display font-bold text-2xl mt-1">{formatINR(stats.totalValue, { decimals: false })}</div>
        </Card>
        <Card className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Units</div>
          <div className="font-display font-bold text-2xl mt-1">{formatNumber(stats.totalUnits)}</div>
          <div className="text-[11px] text-muted-foreground">across {products.length} SKUs</div></Card>
        <Card className="p-4 border-warning/30"><div className="text-[10px] uppercase tracking-wider text-warning-foreground font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low Stock</div>
          <div className="font-display font-bold text-2xl mt-1 text-warning-foreground">{stats.lowStock.length}</div></Card>
        <Card className="p-4 border-destructive/30"><div className="text-[10px] uppercase tracking-wider text-destructive font-semibold">Out of Stock</div>
          <div className="font-display font-bold text-2xl mt-1 text-destructive">{stats.outOfStock.length}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-lg">Stock Levels</h2>
            <div className="relative w-64 max-w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="pl-9 h-9" /></div>
          </div>
          {isLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></div> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-[11px] uppercase text-muted-foreground bg-muted/30"><tr>
                <th className="text-left font-semibold py-2.5 px-4">Product</th><th className="text-right font-semibold py-2.5">In Stock</th>
                <th className="text-right font-semibold py-2.5">Min</th><th className="text-right font-semibold py-2.5 px-4 hidden sm:table-cell">Value</th></tr></thead>
              <tbody className="divide-y">
                {filtered.map(p => {
                  const stock = Number(p.stock_qty);
                  const min = Number(p.low_stock_alert);
                  const status = stock === 0 ? "out" : stock <= min ? "low" : "ok";
                  return (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className="py-2.5 px-4"><div className="font-medium text-sm">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{p.sku}</div></td>
                      <td className="py-2.5 text-right"><div className={cn("font-display font-bold",
                        status === "out" && "text-destructive", status === "low" && "text-warning-foreground")}>{stock}</div>
                        <div className="text-[10px] text-muted-foreground">{p.unit}</div></td>
                      <td className="py-2.5 text-right text-xs text-muted-foreground">{min}</td>
                      <td className="py-2.5 px-4 text-right hidden sm:table-cell font-mono text-xs">{formatINR(stock * Number(p.cost_price), { decimals: false })}</td>
                    </tr>
                  );
                })}
              </tbody></table></div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 border-b"><h2 className="font-display font-semibold text-lg">Recent Movements</h2></div>
          <div className="divide-y max-h-[480px] overflow-y-auto">
            {movements.length === 0 ? <div className="p-8 text-center text-xs text-muted-foreground">No movements yet</div>
              : movements.map((m: any) => (
              <div key={m.id} className="p-3 hover:bg-muted/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.product_name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{m.reference} · {new Date(m.created_at).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={cn("text-[10px] border-0 capitalize", MOVE_STYLES[m.type])}>{m.type}</Badge>
                    <div className={cn("font-mono font-bold text-sm mt-1 flex items-center gap-0.5 justify-end", Number(m.qty) > 0 ? "text-success" : "text-destructive")}>
                      {Number(m.qty) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Number(m.qty) > 0 ? "+" : ""}{m.qty}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <StockAdjustmentDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
