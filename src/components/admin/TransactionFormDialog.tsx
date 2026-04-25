import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAccounts, useCreateTransaction } from "@/hooks/useFinance";
import { useParties } from "@/hooks/useParties";
import { toast } from "sonner";

export const TransactionFormDialog = ({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { data: accounts = [] } = useAccounts();
  const { data: parties = [] } = useParties();
  const create = useCreateTransaction();
  const [form, setForm] = useState<any>({ type: "expense", mode: "Cash", amount: 0, txn_date: new Date().toISOString().slice(0, 10) });
  useEffect(() => {
    if (open && accounts[0] && !form.account_id) setForm((f: any) => ({ ...f, account_id: accounts[0].id }));
  }, [open, accounts]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount || form.amount <= 0) return toast.error("Amount required");
    if (!form.account_id) return toast.error("Pick an account");
    try {
      const partyName = form.party_id ? parties.find((p: any) => p.id === form.party_id)?.name : form.party_name;
      await create.mutateAsync({ ...form, party_name: partyName });
      toast.success("Transaction recorded"); onOpenChange(false);
      setForm({ type: "expense", mode: "Cash", amount: 0, txn_date: new Date().toISOString().slice(0, 10), account_id: accounts[0]?.id });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div><Label>Type</Label>
            <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="receipt">Receipt (money in)</option>
              <option value="payment">Payment (to vendor)</option>
              <option value="income">Other Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div><Label>Account</Label>
            <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.account_id ?? ""} onChange={e => set("account_id", e.target.value)}>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={e => set("amount", Number(e.target.value))} /></div>
          <div><Label>Date</Label><Input type="date" value={form.txn_date} onChange={e => set("txn_date", e.target.value)} /></div>
          <div><Label>Mode</Label>
            <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.mode} onChange={e => set("mode", e.target.value)}>
              <option>Cash</option><option>UPI</option><option>Card</option><option>NEFT</option><option>Cheque</option>
            </select>
          </div>
          {(form.type === "expense" || form.type === "income") && (
            <div><Label>Category</Label>
              <Input value={form.category ?? ""} onChange={e => set("category", e.target.value)} placeholder="Rent / Salaries / Marketing..." />
            </div>
          )}
          {(form.type === "receipt" || form.type === "payment") && (
            <div className="col-span-2"><Label>Party</Label>
              <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.party_id ?? ""} onChange={e => set("party_id", e.target.value)}>
                <option value="">— None —</option>
                {parties.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
              </select>
            </div>
          )}
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending} className="gradient-accent border-0 text-accent-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
