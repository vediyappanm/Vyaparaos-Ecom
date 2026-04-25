import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, LayoutGrid, List, Filter, Edit2, Package } from "lucide-react";
import { PRODUCTS, CATEGORIES } from "@/data/mockData";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function Products() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (activeCat !== "All" && p.category !== activeCat) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase()) && !p.sku.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, activeCat]);

  const stockStatus = (p: typeof PRODUCTS[0]) => {
    if (p.stock === 0) return { label: "Out", cls: "bg-destructive/10 text-destructive" };
    if (p.stock <= p.lowStockAlert) return { label: "Low", cls: "bg-warning/15 text-warning-foreground" };
    return { label: "OK", cls: "bg-success/10 text-success" };
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{PRODUCTS.length} products · {CATEGORIES.length} categories</p>
        </div>
        <Button className="gradient-accent border-0 shadow-glow">
          <Plus className="w-4 h-4 mr-1.5" /> Add Product
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, SKU, barcode..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="w-4 h-4" /> More Filters
            </Button>
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={cn("p-2", view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              ><LayoutGrid className="w-4 h-4" /></button>
              <button
                onClick={() => setView("list")}
                className={cn("p-2", view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              ><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
          {["All", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeCat === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Grid view */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(p => {
            const ss = stockStatus(p);
            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-elegant transition-all group cursor-pointer">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <Badge className={cn("absolute top-2 right-2 border-0 text-[10px]", ss.cls)}>{ss.label}</Badge>
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white">
                    {p.taxRate}% GST
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{p.category}</div>
                  <div className="font-medium text-sm leading-tight mt-0.5 line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <div className="font-display font-bold text-base text-primary">{formatINR(p.price, { decimals: false })}</div>
                      <div className="text-[10px] text-muted-foreground line-through">MRP {formatINR(p.mrp, { decimals: false })}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold">{p.stock}</div>
                      <div className="text-[10px] text-muted-foreground">{p.unit}</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="text-left font-medium py-3 px-4">Product</th>
                  <th className="text-left font-medium py-3 hidden md:table-cell">SKU / HSN</th>
                  <th className="text-right font-medium py-3">Price</th>
                  <th className="text-right font-medium py-3 hidden sm:table-cell">GST</th>
                  <th className="text-right font-medium py-3">Stock</th>
                  <th className="text-right font-medium py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(p => {
                  const ss = stockStatus(p);
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt="" className="w-10 h-10 rounded-md object-cover" />
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 hidden md:table-cell">
                        <div className="font-mono text-xs">{p.sku}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">HSN {p.hsnCode}</div>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="font-display font-semibold">{formatINR(p.price, { decimals: false })}</div>
                        <div className="text-[10px] text-muted-foreground line-through">{formatINR(p.mrp, { decimals: false })}</div>
                      </td>
                      <td className="py-2.5 text-right hidden sm:table-cell">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">{p.taxRate}%</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge className={cn("border-0 font-mono", ss.cls)}>{p.stock}</Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-3.5 h-3.5" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">No products match your filters</p>
        </Card>
      )}
    </div>
  );
}
