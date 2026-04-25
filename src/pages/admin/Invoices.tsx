import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, FileText, Loader2 } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useTenant } from "@/contexts/TenantContext";
import { formatINR } from "@/lib/format";
import { generateInvoicePDF } from "@/lib/invoicePdf";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-success/10 text-success", unpaid: "bg-destructive/10 text-destructive", partial: "bg-warning/15 text-warning-foreground",
};

export default function Invoices() {
  const { tenant } = useTenant();
  const { data: orders = [], isLoading } = useOrders(500);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => orders.filter((o: any) =>
    !query || o.order_number.toLowerCase().includes(query.toLowerCase()) || (o.party_name ?? "").toLowerCase().includes(query.toLowerCase())
  ), [orders, query]);

  const totals = {
    paid: orders.filter((o: any) => o.payment_status === "paid").reduce((s: number, o: any) => s + Number(o.total), 0),
    pending: orders.filter((o: any) => o.payment_status !== "paid").reduce((s: number, o: any) => s + Number(o.balance_due), 0),
    tax: orders.reduce((s: number, o: any) => s + Number(o.tax_amount), 0),
  };

  const downloadInvoice = async (o: any) => {
    try {
      const items = (o.order_items ?? []).map((it: any) => ({
        name: it.product_name, hsnCode: it.hsn_code ?? "", qty: Number(it.qty), unit: "pc",
        unitPrice: Number(it.unit_price), taxRate: Number(it.tax_rate),
      }));
      const doc = await generateInvoicePDF({
        invoiceNumber: o.order_number, date: new Date(o.created_at),
        customerName: o.party_name ?? "Walk-in Customer", customerPhone: o.party_phone ?? undefined,
        paymentMode: o.payment_mode ?? "Cash", items,
        store: tenant ? { name: tenant.name, address: tenant.address ?? "", city: tenant.city ?? "", state: tenant.state ?? "",
          pincode: tenant.pincode ?? "", phone: tenant.phone ?? "", email: tenant.email ?? "", gstin: tenant.gstin ?? "",
          upiId: (tenant.settings as any)?.upi_id ?? "" } : undefined,
      });
      doc.save(`Invoice-${o.order_number}.pdf`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="GST Compliance" title="Invoices" description="All GST-compliant invoices · HSN, CGST/SGST, UPI QR" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 gradient-royal text-white border-0">
          <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Paid</div>
          <div className="font-display font-bold text-2xl mt-1">{formatINR(totals.paid, { decimals: false })}</div>
        </Card>
        <Card className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Outstanding</div>
          <div className="font-display font-bold text-2xl mt-1 text-destructive">{formatINR(totals.pending, { decimals: false })}</div></Card>
        <Card className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Invoices</div>
          <div className="font-display font-bold text-2xl mt-1">{orders.length}</div></Card>
        <Card className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">GST Collected</div>
          <div className="font-display font-bold text-2xl mt-1">{formatINR(totals.tax, { decimals: false })}</div></Card>
      </div>

      <Card className="p-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search invoice # or party..." className="pl-9" /></div></Card>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></div>
          : filtered.length === 0 ? <div className="p-12 text-center text-sm text-muted-foreground"><FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />No invoices yet</div>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground bg-muted/30"><tr>
              <th className="text-left font-semibold py-3 px-4">Invoice #</th><th className="text-left font-semibold py-3">Party</th>
              <th className="text-left font-semibold py-3 hidden md:table-cell">Date</th><th className="text-right font-semibold py-3">Amount</th>
              <th className="text-left font-semibold py-3">Status</th><th className="text-right font-semibold py-3 px-4">Action</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map((o: any) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-primary">{o.order_number}</td>
                  <td className="py-3 font-medium">{o.party_name ?? "Walk-in"}</td>
                  <td className="py-3 text-xs text-muted-foreground hidden md:table-cell">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="py-3 text-right font-display font-semibold">{formatINR(Number(o.total), { decimals: false })}</td>
                  <td className="py-3"><Badge className={cn("border-0 capitalize", STATUS_STYLES[o.payment_status])}>{o.payment_status}</Badge></td>
                  <td className="py-3 px-4 text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadInvoice(o)}><Download className="w-3.5 h-3.5" /></Button></td>
                </tr>
              ))}
            </tbody></table></div>}
      </Card>
    </div>
  );
}
