import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShoppingBag, Download } from "lucide-react";
import { PURCHASES } from "@/data/mockData";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Received: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Partial: "bg-warning/15 text-warning-foreground",
  Paid: "bg-success/10 text-success",
};

export default function Purchases() {
  const totals = {
    value: PURCHASES.reduce((s, p) => s + p.total, 0),
    paid: PURCHASES.reduce((s, p) => s + p.paid, 0),
    due: PURCHASES.reduce((s, p) => s + (p.total - p.paid), 0),
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Procurement"
        title="Purchases"
        description={`${PURCHASES.length} purchase orders · Track vendor bills and dues`}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
            <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground">
              <Plus className="w-4 h-4 mr-1.5" /> New Purchase
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 gradient-royal text-white border-0 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-accent/30 blur-2xl" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Total Purchases</div>
            <div className="font-display font-bold text-2xl mt-1">{formatINR(totals.value, { decimals: false })}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Paid to Vendors</div>
          <div className="font-display font-bold text-2xl mt-1 text-success">{formatINR(totals.paid, { decimals: false })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Outstanding</div>
          <div className="font-display font-bold text-2xl mt-1 text-destructive">{formatINR(totals.due, { decimals: false })}</div>
        </Card>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search PO # or vendor..." className="pl-9" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground bg-white/30">
              <tr>
                <th className="text-left font-semibold py-3 px-4">PO #</th>
                <th className="text-left font-semibold py-3">Vendor</th>
                <th className="text-left font-semibold py-3 hidden md:table-cell">Date</th>
                <th className="text-right font-semibold py-3 hidden sm:table-cell">Items</th>
                <th className="text-right font-semibold py-3">Total</th>
                <th className="text-right font-semibold py-3 hidden lg:table-cell">Paid</th>
                <th className="text-left font-semibold py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {PURCHASES.map(p => (
                <tr key={p.id} className="hover:bg-white/40">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-primary">{p.id}</td>
                  <td className="py-3">
                    <div className="font-medium">{p.vendor}</div>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground hidden md:table-cell">{p.date}</td>
                  <td className="py-3 text-right text-xs hidden sm:table-cell">{p.items}</td>
                  <td className="py-3 text-right font-display font-semibold">{formatINR(p.total, { decimals: false })}</td>
                  <td className="py-3 text-right hidden lg:table-cell text-xs">
                    <div className="font-mono">{formatINR(p.paid, { decimals: false })}</div>
                    {p.paid < p.total && (
                      <div className="text-[10px] text-destructive">Due {formatINR(p.total - p.paid, { decimals: false })}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={cn("border-0", STATUS_STYLES[p.status])}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
