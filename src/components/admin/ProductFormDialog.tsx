import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useUpsertProduct, type DbProduct } from "@/hooks/useProducts";
import { toast } from "sonner";

const empty = {
  name: "", category: "", sku: "", barcode: "", hsn_code: "", unit: "piece",
  price: 0, mrp: 0, cost_price: 0, tax_rate: 18, stock_qty: 0, low_stock_alert: 5,
  image_url: "", description: "", is_active: true,
};

export const ProductFormDialog = ({
  open, onOpenChange, product,
}: { open: boolean; onOpenChange: (b: boolean) => void; product?: DbProduct | null }) => {
  const upsert = useUpsertProduct();
  const [form, setForm] = useState<any>(empty);

  useEffect(() => {
    if (open) setForm(product ? { ...product } : empty);
  }, [open, product]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsert.mutateAsync({
        ...(product?.id ? { id: product.id } : {}),
        name: form.name,
        category: form.category || null,
        sku: form.sku || null,
        barcode: form.barcode || null,
        hsn_code: form.hsn_code || null,
        unit: form.unit,
        price: Number(form.price) || 0,
        mrp: Number(form.mrp) || 0,
        cost_price: Number(form.cost_price) || 0,
        tax_rate: Number(form.tax_rate) || 0,
        stock_qty: Number(form.stock_qty) || 0,
        low_stock_alert: Number(form.low_stock_alert) || 0,
        image_url: form.image_url || null,
        description: form.description || null,
        is_active: form.is_active,
      });
      toast.success(product ? "Product updated" : "Product added");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="Groceries" />
            </div>
            <div>
              <Label>Unit</Label>
              <Input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="piece / kg / litre" />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => set("sku", e.target.value)} />
            </div>
            <div>
              <Label>Barcode</Label>
              <Input value={form.barcode} onChange={e => set("barcode", e.target.value)} />
            </div>
            <div>
              <Label>HSN Code</Label>
              <Input value={form.hsn_code} onChange={e => set("hsn_code", e.target.value)} />
            </div>
            <div>
              <Label>GST %</Label>
              <Input type="number" step="0.01" value={form.tax_rate} onChange={e => set("tax_rate", e.target.value)} />
            </div>
            <div>
              <Label>MRP</Label>
              <Input type="number" step="0.01" value={form.mrp} onChange={e => set("mrp", e.target.value)} />
            </div>
            <div>
              <Label>Selling price *</Label>
              <Input type="number" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} required />
            </div>
            <div>
              <Label>Cost price</Label>
              <Input type="number" step="0.01" value={form.cost_price} onChange={e => set("cost_price", e.target.value)} />
            </div>
            <div>
              <Label>Stock qty</Label>
              <Input type="number" step="0.01" value={form.stock_qty} onChange={e => set("stock_qty", e.target.value)} />
            </div>
            <div>
              <Label>Low stock alert</Label>
              <Input type="number" step="0.01" value={form.low_stock_alert} onChange={e => set("low_stock_alert", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Image URL</Label>
              <Input value={form.image_url} onChange={e => set("image_url", e.target.value)} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={upsert.isPending} className="gradient-accent border-0 shadow-glow text-accent-foreground">
              {upsert.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {product ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
