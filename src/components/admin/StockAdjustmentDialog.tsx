import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCreateStockAdjustment } from "@/hooks/useStockMovements";
import { toast } from "sonner";

export const StockAdjustmentDialog = ({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { data: products = [] } = useProducts();
  const create = useCreateStockAdjustment();
  const [form, setForm] = useState<any>({ type: "adjustment", qty: 0 });
  useEffect(() => { if (open) setForm({ type: "adjustment", qty: 0, product_id: products[0]?.id }); }, [open, products]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async () => {
    const product = products.find((p: any) => p.id === form.product_id);
    if (!product) return toast.error("Pick a product");
    if (!form.qty) return toast.error("Quantity required");
    try {
      await create.mutateAsync({
        product_id: product.id, product_name: product.name,
        qty: Number(form.qty), type: form.type, notes: form.notes,
      });
      toast.success("Stock updated"); onOpenChange(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Stock Adjustment</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label>Product</Label>
            <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.product_id ?? ""} onChange={e => set("product_id", e.target.value)}>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock_qty})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="adjustment">Adjustment (+/−)</option>
                <option value="damage">Damage (−)</option>
                <option value="return">Return (+)</option>
              </select>
            </div>
            <div><Label>Qty (use − to reduce)</Label><Input type="number" value={form.qty} onChange={e => set("qty", e.target.value)} /></div>
          </div>
          <div><Label>Notes</Label><Input value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} placeholder="Reason..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending} className="gradient-accent border-0 text-accent-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
