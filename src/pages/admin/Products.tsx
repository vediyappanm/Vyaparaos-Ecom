import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, LayoutGrid, List, Edit2, Package, Trash2, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useProducts, useDeleteProduct, type DbProduct } from "@/hooks/useProducts";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { toast } from "sonner";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop";

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const del = useDeleteProduct();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [open, setOpen] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => products.filter(p => {
    if (activeCat !== "All" && p.category !== activeCat) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  }), [products, query, activeCat]);

  const stockStatus = (p: DbProduct) => {
    if (Number(p.stock_qty) === 0) return { label: "Out", cls: "bg-destructive/10 text-destructive" };
    if (Number(p.stock_qty) <= Number(p.low_stock_alert)) return { label: "Low", cls: "bg-warning/15 text-warning-foreground" };
    return { label: "OK", cls: "bg-success/10 text-success" };
  };

  const onDelete = async (p: DbProduct) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    try { await del.mutateAsync(p.id); toast.success("Deleted"); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} products · {categories.length} categories</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gradient-accent border-0 shadow-glow text-accent-foreground">
          <Plus className="w-4 h-4 mr-1.5" /> Add Product
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, SKU..." className="pl-9" />
          </div>
          <div className="flex border border-border rounded-md overflow-hidden self-start">
            <button onClick={() => setView("grid")} className={cn("p-2", view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView("list")} className={cn("p-2", view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}><List className="w-4 h-4" /></button>
          </div>
        </div>
        {categories.length > 0 && (
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {["All", ...categories].map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  activeCat === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >{cat}</button>
            ))}
          </div>
        )}
      </Card>

      {isLoading ? (
        <Card className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">{products.length === 0 ? "No products yet — add your first one." : "No products match your filters"}</p>
          {products.length === 0 && (
            <Button onClick={() => { setEditing(null); setOpen(true); }} className="mt-4 gradient-accent border-0 text-accent-foreground">
              <Plus className="w-4 h-4 mr-1.5" /> Add your first product
            </Button>
          )}
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(p => {
            const ss = stockStatus(p);
            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-elegant transition-all group cursor-pointer" onClick={() => { setEditing(p); setOpen(true); }}>
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img src={p.image_url || FALLBACK_IMG} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <Badge className={cn("absolute top-2 right-2 border-0 text-[10px]", ss.cls)}>{ss.label}</Badge>
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white">{p.tax_rate}% GST</div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{p.category || "Uncategorised"}</div>
                  <div className="font-medium text-sm leading-tight mt-0.5 line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <div className="font-display font-bold text-base text-primary">{formatINR(Number(p.price), { decimals: false })}</div>
                      {Number(p.mrp) > 0 && <div className="text-[10px] text-muted-foreground line-through">MRP {formatINR(Number(p.mrp), { decimals: false })}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold">{p.stock_qty}</div>
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
                  <th className="text-right font-medium py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(p => {
                  const ss = stockStatus(p);
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image_url || FALLBACK_IMG} alt="" className="w-10 h-10 rounded-md object-cover" />
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.category || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 hidden md:table-cell">
                        <div className="font-mono text-xs">{p.sku || "—"}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">HSN {p.hsn_code || "—"}</div>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="font-display font-semibold">{formatINR(Number(p.price), { decimals: false })}</div>
                        {Number(p.mrp) > 0 && <div className="text-[10px] text-muted-foreground line-through">{formatINR(Number(p.mrp), { decimals: false })}</div>}
                      </td>
                      <td className="py-2.5 text-right hidden sm:table-cell">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">{p.tax_rate}%</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge className={cn("border-0 font-mono", ss.cls)}>{p.stock_qty}</Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(p); setOpen(true); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(p)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ProductFormDialog open={open} onOpenChange={setOpen} product={editing} />
    </div>
  );
}
