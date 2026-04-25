import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banknote, Landmark, Smartphone, Plus, ArrowDownRight, ArrowUpRight, Receipt, Wallet, Loader2 } from "lucide-react";
import { useAccounts, useTransactions } from "@/hooks/useFinance";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { TransactionFormDialog } from "@/components/admin/TransactionFormDialog";

const ICONS: Record<string, any> = { cash: Banknote, bank: Landmark, upi: Smartphone, wallet: Wallet };
const TYPE_STYLES: Record<string, string> = {
  receipt: "bg-success/10 text-success", income: "bg-success/10 text-success",
  payment: "bg-destructive/10 text-destructive", expense: "bg-warning/15 text-warning-foreground",
};

export default function Finance() {
  const { data: accounts = [], isLoading: aLoad } = useAccounts();
  const { data: txns = [], isLoading: tLoad } = useTransactions(50);
  const [open, setOpen] = useState(false);

  const totalCash = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const expenseByCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of txns as any[]) if (t.type === "expense") m[t.category ?? "Other"] = (m[t.category ?? "Other"] ?? 0) + Number(t.amount);
    return Object.entries(m).map(([category, amount]) => ({ category, amount }));
  }, [txns]);
  const totalExpense = expenseByCat.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="Money" title="Finance" description="Cash, bank, expenses and day book"
        actions={<Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Transaction</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {aLoad ? <Card className="p-12 sm:col-span-3 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></Card>
          : accounts.map((a, i) => {
          const Icon = ICONS[a.type] ?? Wallet;
          return (
            <Card key={a.id} className={cn("p-5 relative overflow-hidden", i === 0 && "gradient-royal text-white border-0")}>
              <div className="flex items-start justify-between">
                <div><div className={cn("text-[10px] uppercase tracking-wider font-semibold", i === 0 ? "text-white/70" : "text-muted-foreground")}>{a.name}</div>
                  <div className="font-display font-bold text-2xl mt-1.5">{formatINR(Number(a.balance), { decimals: false })}</div></div>
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", i === 0 ? "bg-white/15" : "bg-primary/10 text-primary")}>
                  <Icon className="w-5 h-5" /></div>
              </div>
            </Card>
          );
        })}
      </div>

      {expenseByCat.length > 0 && (
        <Card className="p-5"><h2 className="font-display font-semibold text-lg mb-1">Expense Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-3">Total {formatINR(totalExpense, { decimals: false })}</p>
          <div className="space-y-2">
            {expenseByCat.sort((a, b) => b.amount - a.amount).map(e => (
              <div key={e.category}>
                <div className="flex justify-between text-xs mb-1"><span>{e.category}</span><span className="font-mono font-semibold">{formatINR(e.amount, { decimals: false })}</span></div>
                <div className="h-1.5 bg-muted rounded overflow-hidden"><div className="h-full bg-accent" style={{ width: `${(e.amount / totalExpense) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b"><h2 className="font-display font-semibold text-lg flex items-center gap-2"><Receipt className="w-5 h-5 text-accent" />Day Book</h2>
          <p className="text-xs text-muted-foreground">All transactions · Total cash {formatINR(totalCash, { decimals: false })}</p></div>
        {tLoad ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></div>
          : txns.length === 0 ? <div className="p-12 text-center text-sm text-muted-foreground">No transactions yet</div>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground bg-muted/30"><tr>
              <th className="text-left font-semibold py-2.5 px-4">Date</th><th className="text-left font-semibold py-2.5">Type</th>
              <th className="text-left font-semibold py-2.5">Party / Category</th>
              <th className="text-left font-semibold py-2.5 hidden md:table-cell">Account</th>
              <th className="text-right font-semibold py-2.5 px-4">Amount</th></tr></thead>
            <tbody className="divide-y">
              {(txns as any[]).map(t => {
                const isIn = t.type === "receipt" || t.type === "income";
                return (
                  <tr key={t.id} className="hover:bg-muted/40">
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(t.txn_date).toLocaleDateString("en-IN")}</td>
                    <td className="py-2.5"><Badge className={cn("border-0 gap-1 capitalize", TYPE_STYLES[t.type])}>
                      {isIn ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}{t.type}</Badge></td>
                    <td className="py-2.5"><div className="font-medium">{t.party_name || t.category || "—"}</div>
                      {t.notes && <div className="text-[10px] text-muted-foreground">{t.notes}</div>}</td>
                    <td className="py-2.5 text-xs hidden md:table-cell">{t.accounts?.name ?? "—"}</td>
                    <td className={cn("py-2.5 px-4 text-right font-display font-bold", isIn ? "text-success" : "text-destructive")}>
                      {isIn ? "+" : "−"}{formatINR(Number(t.amount), { decimals: false })}</td>
                  </tr>
                );
              })}
            </tbody></table></div>}
      </Card>

      <TransactionFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
