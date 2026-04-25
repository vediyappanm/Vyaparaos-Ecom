import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useParties } from "@/hooks/useParties";
import { useCreatePurchase } from "@/hooks/usePurchases";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

type Line = { product_id: string | null; product_name: string; qty: number; unit_price: number; tax_rate: number };

export const PurchaseFormDialog = ({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { data: products = [] } = useProducts();
  const { data: parties = [] } = useParties();
  const vendors = parties.filter((p: any) => p.type === "vendor");
  const create = useCreatePurchase();
  const [vendorId, setVendorId] = useState<string>("");
  const [paid, setPaid] = useState<number>(0);
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => { if (open) { setVendorId(vendors[0]?.id ?? ""); setPaid(0); setLines([]); } }, [open]);

  const addLine = () => {
    const p = products[0];
    if (!p) return toast.error("Add a product first");
    setLines(l => [...l, { product_id: p.id, product_name: p.name, qty: 1, unit_price: Number(p.cost_price ?? p.price), tax_rate: Number(p.tax_rate) }]);
  };
  const updateLine = (i: number, patch: Partial<Line>) => setLines(l => l.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i));

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);
  const tax = lines.reduce((s, l) => s + l.qty * l.unit_price * (l.tax_rate / 100), 0);
  const total = subtotal + tax;

  const submit = async () => {
    const vendor = vendors.find((v: any) => v.id === vendorId);
    if (!vendor) return toast.error("Pick a vendor");
    if (lines.length === 0) return toast.error("Add at least one item");
    try {
      const items = lines.map(l => {
        const lineSub = l.qty * l.unit_price;
        const lineTax = lineSub * (l.tax_rate / 100);
        return { ...l, tax_amount: lineTax, total: lineSub + lineTax };
      });
      const status = paid >= total ? "paid" : paid > 0 ? "partial" : "received";
      await create.mutateAsync({
        vendor_id: vendor.id, vendor_name: vendor.name,
        subtotal, tax_amount: tax, total, paid_amount: paid, status: status as any, items,
      });
      toast.success("Purchase recorded — stock updated"); onOpenChange(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Purchase</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Vendor</Label>
              <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={vendorId} onChange={e => setVendorId(e.target.value)}>
                <option value="">— Select —</option>
                {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div><Label>Amount Paid Now</Label><Input type="number" value={paid} onChange={e => setPaid(Number(e.target.value))} /></div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs"><tr>
                <th className="text-left p-2">Product</th><th className="p-2 w-20">Qty</th>
                <th className="p-2 w-24">Cost</th><th className="p-2 w-16">Tax %</th>
                <th className="p-2 w-24 text-right">Total</th><th className="p-2 w-10" />
              </tr></thead>
              <tbody className="divide-y">
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      <select className="w-full h-9 rounded border bg-background px-2 text-sm" value={l.product_id ?? ""} onChange={e => {
                        const p = products.find((x: any) => x.id === e.target.value);
                        if (p) updateLine(i, { product_id: p.id, product_name: p.name, unit_price: Number(p.cost_price ?? p.price), tax_rate: Number(p.tax_rate) });
                      }}>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="p-2"><Input type="number" className="h-9" value={l.qty} onChange={e => updateLine(i, { qty: Number(e.target.value) })} /></td>
                    <td className="p-2"><Input type="number" className="h-9" value={l.unit_price} onChange={e => updateLine(i, { unit_price: Number(e.target.value) })} /></td>
                    <td className="p-2"><Input type="number" className="h-9" value={l.tax_rate} onChange={e => updateLine(i, { tax_rate: Number(e.target.value) })} /></td>
                    <td className="p-2 text-right font-mono">{formatINR(l.qty * l.unit_price * (1 + l.tax_rate / 100), { decimals: false })}</td>
                    <td className="p-2"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLine(i)}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                  </tr>
                ))}
                {lines.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">No items yet</td></tr>}
              </tbody>
            </table>
            <div className="p-2 border-t"><Button variant="outline" size="sm" onClick={addLine}><Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item</Button></div>
          </div>

          <div className="flex justify-end">
            <div className="text-sm space-y-1 min-w-[220px]">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{formatINR(subtotal, { decimals: false })}</span></div>
              <div className="flex justify-between"><span>Tax</span><span className="font-mono">{formatINR(tax, { decimals: false })}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span className="font-mono">{formatINR(total, { decimals: false })}</span></div>
              <div className="flex justify-between text-destructive"><span>Due</span><span className="font-mono">{formatINR(Math.max(0, total - paid), { decimals: false })}</span></div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending} className="gradient-accent border-0 text-accent-foreground">Save Purchase</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
