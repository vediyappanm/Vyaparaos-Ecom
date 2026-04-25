import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, FileText, Send, Eye, MoreVertical } from "lucide-react";
import { INVOICES, ORDERS, STORE } from "@/data/mockData";
import { formatINR } from "@/lib/format";
import { generateInvoicePDF } from "@/lib/invoicePdf";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Generated: "bg-muted text-muted-foreground",
  Sent: "bg-warning/15 text-warning-foreground",
  Paid: "bg-success/10 text-success",
  Overdue: "bg-destructive/10 text-destructive",
};

const TEMPLATES = [
  { id: "modern", name: "Modern", desc: "Clean royal look", active: true },
  { id: "classic", name: "Classic", desc: "Traditional Indian invoice", active: false },
  { id: "minimal", name: "Minimal", desc: "Pure typography", active: false },
];

export default function Invoices() {
  const [query, setQuery] = useState("");
  const filtered = INVOICES.filter(i =>
    !query || i.id.toLowerCase().includes(query.toLowerCase()) || i.party.toLowerCase().includes(query.toLowerCase())
  );

  const totals = {
    paid: INVOICES.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0),
    pending: INVOICES.filter(i => i.status !== "Paid").reduce((s, i) => s + i.amount, 0),
  };

  const downloadInvoice = async (invId: string) => {
    const order = ORDERS.find(o => o.id === invId.replace("INV-", "SRM-"));
    if (!order) return;
    const doc = await generateInvoicePDF({
      invoiceNumber: invId,
      date: new Date(),
      customerName: order.customer,
      customerPhone: order.phone !== "—" ? order.phone : undefined,
      paymentMode: order.payment,
      items: [
        { name: "Sample Line Item", hsnCode: "1006", qty: 1, unit: "pkt", unitPrice: order.subtotal, taxRate: 12 },
      ],
    });
    doc.save(`${invId}.pdf`);
    toast.success(`${invId} downloaded`);
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="GST Compliance"
        title="Invoices"
        description="All GST-compliant invoices · HSN, CGST/SGST split, UPI QR · e-invoice ready"
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Bulk ZIP</Button>
            <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground">
              <FileText className="w-4 h-4 mr-1.5" /> GSTR-1 Report
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 gradient-royal text-white border-0 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-accent/30 blur-2xl" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Paid</div>
            <div className="font-display font-bold text-2xl mt-1">{formatINR(totals.paid, { decimals: false })}</div>
            <div className="text-[11px] text-white/70 mt-0.5">{INVOICES.filter(i => i.status === "Paid").length} invoices</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Outstanding</div>
          <div className="font-display font-bold text-2xl mt-1 text-destructive">{formatINR(totals.pending, { decimals: false })}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{INVOICES.filter(i => i.status !== "Paid").length} pending</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">This Month</div>
          <div className="font-display font-bold text-2xl mt-1">{INVOICES.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Invoices generated</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">GST Collected</div>
          <div className="font-display font-bold text-2xl mt-1 text-gold">{formatINR(ORDERS.reduce((s, o) => s + o.tax, 0), { decimals: false })}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">CGST + SGST</div>
        </Card>
      </div>

      {/* Templates */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">Invoice Templates</h2>
          <Button variant="ghost" size="sm">Customise</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              className={cn(
                "text-left p-4 rounded-xl border-2 transition-all",
                t.active ? "border-accent bg-accent/5 shadow-glow" : "border-border hover:border-accent/50 bg-white/40"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
                {t.active && <Badge className="bg-accent text-accent-foreground border-0">Active</Badge>}
              </div>
              <div className="mt-3 h-20 rounded bg-gradient-to-br from-white to-muted/40 border border-border/40 p-2">
                <div className="h-1.5 w-1/3 rounded bg-primary/30" />
                <div className="h-1 w-1/2 rounded bg-muted-foreground/20 mt-1.5" />
                <div className="h-1 w-2/3 rounded bg-muted-foreground/20 mt-1" />
                <div className="h-3 w-1/4 rounded bg-accent/40 mt-3 ml-auto" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search invoice # or party..." className="pl-9" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground bg-white/30">
              <tr>
                <th className="text-left font-semibold py-3 px-4">Invoice #</th>
                <th className="text-left font-semibold py-3">Party</th>
                <th className="text-left font-semibold py-3 hidden md:table-cell">Date</th>
                <th className="text-right font-semibold py-3">Amount</th>
                <th className="text-left font-semibold py-3">Status</th>
                <th className="text-right font-semibold py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-white/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-primary">{inv.id}</td>
                  <td className="py-3 font-medium">{inv.party}</td>
                  <td className="py-3 text-xs text-muted-foreground hidden md:table-cell">{inv.date}</td>
                  <td className="py-3 text-right font-display font-semibold">{formatINR(inv.amount, { decimals: false })}</td>
                  <td className="py-3">
                    <Badge className={cn("border-0", STATUS_STYLES[inv.status])}>{inv.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadInvoice(inv.id)} title="Download">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="WhatsApp">
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
