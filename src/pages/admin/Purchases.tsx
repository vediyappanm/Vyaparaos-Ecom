import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { usePurchases } from "@/hooks/usePurchases";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { PurchaseFormDialog } from "@/components/admin/PurchaseFormDialog";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", received: "bg-blue-500/10 text-blue-700",
  partial: "bg-warning/15 text-warning-foreground", paid: "bg-success/10 text-success",
};

export default function Purchases() {
  const { data: purchases = [], isLoading } = usePurchases();
  const [open, setOpen] = useState(false);

  const totals = {
    value: purchases.reduce((s: number, p: any) => s + Number(p.total), 0),
    paid: purchases.reduce((s: number, p: any) => s + Number(p.paid_amount), 0),
    due: purchases.reduce((s: number, p: any) => s + (Number(p.total) - Number(p.paid_amount)), 0),
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="Procurement" title="Purchases" description={`${purchases.length} purchase orders · vendor bills and dues`}
        actions={<Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Purchase</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 gradient-royal text-white border-0"><div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Total Purchases</div>
          <div className="font-display font-bold text-2xl mt-1">{formatINR(totals.value, { decimals: false })}</div></Card>
        <Card className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Paid</div>
          <div className="font-display font-bold text-2xl mt-1 text-success">{formatINR(totals.paid, { decimals: false })}</div></Card>
        <Card className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Outstanding</div>
          <div className="font-display font-bold text-2xl mt-1 text-destructive">{formatINR(totals.due, { decimals: false })}</div></Card>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></div>
          : purchases.length === 0 ? <div className="p-12 text-center text-sm text-muted-foreground">No purchases yet — record your first vendor bill.</div>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground bg-muted/30"><tr>
              <th className="text-left font-semibold py-3 px-4">PO #</th><th className="text-left font-semibold py-3">Vendor</th>
              <th className="text-left font-semibold py-3 hidden md:table-cell">Date</th><th className="text-right font-semibold py-3">Total</th>
              <th className="text-right font-semibold py-3 hidden lg:table-cell">Paid</th><th className="text-left font-semibold py-3 px-4">Status</th></tr></thead>
            <tbody className="divide-y">
              {purchases.map((p: any) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-primary">{p.purchase_number}</td>
                  <td className="py-3 font-medium">{p.vendor_name}</td>
                  <td className="py-3 text-xs text-muted-foreground hidden md:table-cell">{new Date(p.purchase_date).toLocaleDateString("en-IN")}</td>
                  <td className="py-3 text-right font-display font-semibold">{formatINR(Number(p.total), { decimals: false })}</td>
                  <td className="py-3 text-right hidden lg:table-cell text-xs">
                    <div className="font-mono">{formatINR(Number(p.paid_amount), { decimals: false })}</div>
                    {Number(p.paid_amount) < Number(p.total) && <div className="text-[10px] text-destructive">Due {formatINR(Number(p.total) - Number(p.paid_amount), { decimals: false })}</div>}
                  </td>
                  <td className="py-3 px-4"><Badge className={cn("border-0 capitalize", STATUS_STYLES[p.status])}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody></table></div>}
      </Card>

      <PurchaseFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
