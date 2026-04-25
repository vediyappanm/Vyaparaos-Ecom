import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, MessageCircle, FileText, Users, Building2 } from "lucide-react";
import { PARTIES, sampleLedger } from "@/data/mockData";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Parties() {
  const [tab, setTab] = useState<"Customer" | "Vendor">("Customer");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(PARTIES.find(p => p.type === "Customer") || PARTIES[0]);

  const filtered = PARTIES.filter(p =>
    p.type === tab && (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.phone.includes(query))
  );

  const counts = {
    customers: PARTIES.filter(p => p.type === "Customer").length,
    vendors: PARTIES.filter(p => p.type === "Vendor").length,
    receivable: PARTIES.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0),
    payable: Math.abs(PARTIES.filter(p => p.balance < 0).reduce((s, p) => s + p.balance, 0)),
  };

  const ledger = sampleLedger(selected.name);

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="People"
        title="Parties"
        description="Customers and vendors with full ledger and outstanding balances"
        actions={
          <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground">
            <Plus className="w-4 h-4 mr-1.5" /> Add Party
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Customers</span></div>
          <div className="font-display font-bold text-2xl mt-1">{counts.customers}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Vendors</span></div>
          <div className="font-display font-bold text-2xl mt-1">{counts.vendors}</div>
        </Card>
        <Card className="p-4 border-success/30">
          <div className="text-[10px] uppercase tracking-wider text-success font-semibold">To Receive</div>
          <div className="font-display font-bold text-2xl mt-1 text-success">{formatINR(counts.receivable, { decimals: false })}</div>
        </Card>
        <Card className="p-4 border-destructive/30">
          <div className="text-[10px] uppercase tracking-wider text-destructive font-semibold">To Pay</div>
          <div className="font-display font-bold text-2xl mt-1 text-destructive">{formatINR(counts.payable, { decimals: false })}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <Card className="p-3">
            <div className="flex bg-white/40 rounded-lg p-1 mb-3">
              {(["Customer", "Vendor"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-semibold rounded transition-all",
                    tab === t ? "bg-primary text-primary-foreground shadow-elegant" : "text-muted-foreground"
                  )}
                >
                  {t}s ({t === "Customer" ? counts.customers : counts.vendors})
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or phone..." className="pl-9" />
            </div>
          </Card>

          <Card className="overflow-hidden divide-y divide-border/60">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={cn(
                  "w-full text-left p-3 hover:bg-white/40 transition-colors",
                  selected.id === p.id && "bg-accent/10 border-l-4 border-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-royal text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {p.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.phone} · {p.city}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn(
                      "font-display font-bold text-sm",
                      p.balance > 0 ? "text-success" : p.balance < 0 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {p.balance === 0 ? "—" : formatINR(Math.abs(p.balance), { decimals: false })}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {p.balance > 0 ? "Dr" : p.balance < 0 ? "Cr" : "Settled"}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </Card>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5 royal-orb-bg">
            <div className="relative flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-royal text-white flex items-center justify-center font-display font-bold text-xl shrink-0 ring-2 ring-accent/40">
                {selected.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className="text-[10px]">{selected.type}</Badge>
                <h2 className="font-display font-bold text-xl mt-1">{selected.name}</h2>
                <div className="text-sm text-muted-foreground mt-0.5">{selected.phone} · {selected.city}</div>
                {selected.gstin && <div className="text-[11px] font-mono mt-1 text-gold">GSTIN {selected.gstin}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Balance</div>
                <div className={cn(
                  "font-display font-bold text-2xl",
                  selected.balance > 0 ? "text-success" : selected.balance < 0 ? "text-destructive" : ""
                )}>
                  {selected.balance === 0 ? "Settled" : formatINR(Math.abs(selected.balance), { decimals: false })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {selected.balance > 0 ? "Receivable" : selected.balance < 0 ? "Payable" : ""}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1.5" /> Call</Button>
              <Button variant="outline" size="sm"><MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp</Button>
              <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-1.5" /> Statement</Button>
              <Button size="sm" className="gradient-accent border-0 text-accent-foreground"><Plus className="w-4 h-4 mr-1.5" /> Receive Payment</Button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold">Ledger</h3>
                <p className="text-xs text-muted-foreground">Last 5 transactions · Running balance</p>
              </div>
              <Button variant="ghost" size="sm">Full ledger →</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase text-muted-foreground bg-white/30">
                  <tr>
                    <th className="text-left font-semibold py-2.5 px-4">Date</th>
                    <th className="text-left font-semibold py-2.5">Particulars</th>
                    <th className="text-right font-semibold py-2.5">Debit</th>
                    <th className="text-right font-semibold py-2.5">Credit</th>
                    <th className="text-right font-semibold py-2.5 px-4">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {ledger.map((row, i) => (
                    <tr key={i} className="hover:bg-white/40">
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">{row.date}</td>
                      <td className="py-2.5">{row.particulars}</td>
                      <td className="py-2.5 text-right font-mono text-success">{row.debit ? formatINR(row.debit, { decimals: false }) : "—"}</td>
                      <td className="py-2.5 text-right font-mono text-destructive">{row.credit ? formatINR(row.credit, { decimals: false }) : "—"}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold">{formatINR(row.balance, { decimals: false })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
