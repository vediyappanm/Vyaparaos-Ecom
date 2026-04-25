import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, MessageCircle, FileText, Users, Building2, Loader2, Pencil, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { usePartyBalances, useDeleteParty, usePartyLedger } from "@/hooks/useParties";
import { PartyFormDialog } from "@/components/admin/PartyFormDialog";
import { toast } from "sonner";

export default function Parties() {
  const { data: parties = [], isLoading } = usePartyBalances();
  const del = useDeleteParty();
  const [tab, setTab] = useState<"customer" | "vendor">("customer");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = parties.filter((p: any) =>
    p.type === tab && (!query || p.name.toLowerCase().includes(query.toLowerCase()) || (p.phone ?? "").includes(query))
  );
  const current = selected ?? filtered[0];
  const { data: ledger = [] } = usePartyLedger(current?.id ?? null);

  const counts = {
    customers: parties.filter((p: any) => p.type === "customer").length,
    vendors: parties.filter((p: any) => p.type === "vendor").length,
    receivable: parties.filter((p: any) => p.balance > 0).reduce((s: number, p: any) => s + p.balance, 0),
    payable: Math.abs(parties.filter((p: any) => p.balance < 0).reduce((s: number, p: any) => s + p.balance, 0)),
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this party?")) return;
    try { await del.mutateAsync(id); toast.success("Deleted"); setSelected(null); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="People" title="Parties" description="Customers and vendors with full ledger and balances"
        actions={<Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" onClick={() => { setEditing({ type: tab }); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> Add {tab === "customer" ? "Customer" : "Vendor"}
        </Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4"><div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Customers</span></div><div className="font-display font-bold text-2xl mt-1">{counts.customers}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Vendors</span></div><div className="font-display font-bold text-2xl mt-1">{counts.vendors}</div></Card>
        <Card className="p-4 border-success/30"><div className="text-[10px] uppercase tracking-wider text-success font-semibold">To Receive</div><div className="font-display font-bold text-2xl mt-1 text-success">{formatINR(counts.receivable, { decimals: false })}</div></Card>
        <Card className="p-4 border-destructive/30"><div className="text-[10px] uppercase tracking-wider text-destructive font-semibold">To Pay</div><div className="font-display font-bold text-2xl mt-1 text-destructive">{formatINR(counts.payable, { decimals: false })}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <Card className="p-3">
            <div className="flex bg-muted/40 rounded-lg p-1 mb-3">
              {(["customer", "vendor"] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setSelected(null); }}
                  className={cn("flex-1 py-1.5 text-xs font-semibold rounded transition-all capitalize",
                    tab === t ? "bg-primary text-primary-foreground shadow-elegant" : "text-muted-foreground")}>
                  {t}s ({t === "customer" ? counts.customers : counts.vendors})
                </button>
              ))}
            </div>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="pl-9" /></div>
          </Card>

          <Card className="overflow-hidden divide-y divide-border/60 max-h-[600px] overflow-y-auto">
            {isLoading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" /></div>
              : filtered.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No {tab}s yet</div>
              : filtered.map((p: any) => (
                <button key={p.id} onClick={() => setSelected(p)}
                  className={cn("w-full text-left p-3 hover:bg-muted/40", current?.id === p.id && "bg-accent/10 border-l-4 border-accent")}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-royal text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.phone ?? "—"} · {p.city ?? ""}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn("font-display font-bold text-sm", p.balance > 0 ? "text-success" : p.balance < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {p.balance === 0 ? "—" : formatINR(Math.abs(p.balance), { decimals: false })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{p.balance > 0 ? "Dr" : p.balance < 0 ? "Cr" : "Settled"}</div>
                    </div>
                  </div>
                </button>
              ))}
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {current ? (
            <>
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-royal text-white flex items-center justify-center font-display font-bold text-xl shrink-0">
                    {current.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[10px] capitalize">{current.type}</Badge>
                    <h2 className="font-display font-bold text-xl mt-1">{current.name}</h2>
                    <div className="text-sm text-muted-foreground mt-0.5">{current.phone ?? "—"} · {current.city ?? ""}</div>
                    {current.gstin && <div className="text-[11px] font-mono mt-1">GSTIN {current.gstin}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Balance</div>
                    <div className={cn("font-display font-bold text-2xl", current.balance > 0 ? "text-success" : current.balance < 0 ? "text-destructive" : "")}>
                      {current.balance === 0 ? "Settled" : formatINR(Math.abs(current.balance), { decimals: false })}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {current.phone && <Button variant="outline" size="sm" asChild><a href={`tel:${current.phone}`}><Phone className="w-4 h-4 mr-1.5" />Call</a></Button>}
                  {current.phone && <Button variant="outline" size="sm" asChild><a href={`https://wa.me/${current.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4 mr-1.5" />WhatsApp</a></Button>}
                  <Button variant="outline" size="sm" onClick={() => { setEditing(current); setDialogOpen(true); }}><Pencil className="w-4 h-4 mr-1.5" />Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(current.id)}><Trash2 className="w-4 h-4 mr-1.5" />Delete</Button>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="p-4 border-b"><h3 className="font-display font-semibold flex items-center gap-2"><FileText className="w-4 h-4" />Ledger</h3>
                <p className="text-xs text-muted-foreground">All transactions with running balance</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase text-muted-foreground bg-muted/30">
                      <tr><th className="text-left font-semibold py-2.5 px-4">Date</th><th className="text-left font-semibold py-2.5">Particulars</th>
                      <th className="text-right font-semibold py-2.5">Debit</th><th className="text-right font-semibold py-2.5">Credit</th>
                      <th className="text-right font-semibold py-2.5 px-4">Balance</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {ledger.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-xs text-muted-foreground">No transactions yet</td></tr>
                        : ledger.map((row, i) => (
                        <tr key={i}><td className="py-2.5 px-4 text-xs text-muted-foreground">{new Date(row.date).toLocaleDateString("en-IN")}</td>
                          <td className="py-2.5">{row.particulars}</td>
                          <td className="py-2.5 text-right font-mono text-success">{row.debit ? formatINR(row.debit, { decimals: false }) : "—"}</td>
                          <td className="py-2.5 text-right font-mono text-destructive">{row.credit ? formatINR(row.credit, { decimals: false }) : "—"}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold">{formatINR(row.balance, { decimals: false })}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : <Card className="p-12 text-center text-sm text-muted-foreground">Select a party to view details</Card>}
        </div>
      </div>

      <PartyFormDialog open={dialogOpen} onOpenChange={setDialogOpen} party={editing} defaultType={tab} />
    </div>
  );
}
