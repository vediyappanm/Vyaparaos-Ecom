import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Store, FileText, Receipt, CreditCard, Bell, Languages,
  Plug, Database, Crown, Save,
} from "lucide-react";
import { STORE } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";

const TABS = [
  { id: "store", label: "Store Profile", icon: Store },
  { id: "invoice", label: "Invoice", icon: FileText },
  { id: "tax", label: "Tax / GST", icon: Receipt },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "notify", label: "Notifications", icon: Bell },
  { id: "language", label: "Language", icon: Languages },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "data", label: "Backup & Export", icon: Database },
];

export default function Settings() {
  const [tab, setTab] = useState("store");

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Configure your store, invoices, taxes, payments and integrations"
        actions={
          <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground">
            <Save className="w-4 h-4 mr-1.5" /> Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Tabs */}
        <Card className="p-2 lg:sticky lg:top-20 lg:self-start">
          <div className="flex lg:flex-col gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  tab === t.id
                    ? "gradient-royal text-white shadow-elegant"
                    : "text-muted-foreground hover:bg-white/50"
                )}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {tab === "store" && (
            <Card className="p-6">
              <div className="flex items-center gap-4 pb-5 border-b border-border/50">
                <div className="w-16 h-16 rounded-2xl gradient-royal text-white flex items-center justify-center ring-2 ring-accent/40 shadow-glow">
                  <Crown className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">{STORE.name}</h2>
                  <p className="text-xs text-muted-foreground">Upload logo for invoices and storefront</p>
                  <Button variant="outline" size="sm" className="mt-2">Upload Logo</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <Field label="Store Name" defaultValue={STORE.name} />
                <Field label="Owner Name" defaultValue={STORE.ownerName} />
                <Field label="Phone" defaultValue={STORE.phone} />
                <Field label="Email" defaultValue={STORE.email} />
                <Field label="GSTIN" defaultValue={STORE.gstin} />
                <Field label="UPI ID" defaultValue={STORE.upiId} />
                <Field label="Address" defaultValue={STORE.address} className="md:col-span-2" />
                <Field label="City" defaultValue={STORE.city} />
                <Field label="Pincode" defaultValue={STORE.pincode} />
              </div>
            </Card>
          )}

          {tab === "invoice" && (
            <Card className="p-6 space-y-5">
              <h2 className="font-display font-bold text-lg">Invoice Settings</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Invoice Prefix" defaultValue={STORE.invoicePrefix} />
                <Field label="Starting Number" defaultValue="1043" />
                <div>
                  <Label className="text-xs">Active Template</Label>
                  <select className="mt-1.5 w-full h-10 rounded-md border border-input bg-white/60 px-3 text-sm">
                    <option>Modern (Royal)</option><option>Classic</option><option>Minimal</option>
                  </select>
                </div>
              </div>
              <Field label="Terms & Conditions" defaultValue="Goods once sold cannot be returned. E&OE." />
              <Field label="Footer Note" defaultValue="Thank you for shopping at Sharma Royal Mart!" />
              <div className="space-y-3 pt-3 border-t border-border/50">
                <Toggle label="Show UPI QR code" desc="Add a scannable UPI payment QR on every invoice" defaultChecked />
                <Toggle label="Show HSN codes" desc="Required for GST-registered businesses" defaultChecked />
                <Toggle label="Generate e-invoice (IRN)" desc="For B2B invoices above ₹50,000" />
              </div>
            </Card>
          )}

          {tab === "tax" && (
            <Card className="p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Tax & GST Settings</h2>
              <Field label="Default GST Rate (%)" defaultValue="18" />
              <Field label="State Code" defaultValue={STORE.stateCode} />
              <div className="space-y-3 pt-3 border-t border-border/50">
                <Toggle label="Auto-detect interstate" desc="Switch to IGST when buyer state ≠ store state" defaultChecked />
                <Toggle label="GST inclusive prices" desc="Treat catalog prices as GST-inclusive" />
                <Toggle label="Composition scheme" desc="For turnover under ₹1.5 Cr" />
              </div>
              <div>
                <Label className="text-xs">Common GST Slabs</Label>
                <div className="flex gap-2 mt-2">
                  {[0, 5, 12, 18, 28].map(r => (
                    <Badge key={r} variant="outline" className="px-3 py-1 font-mono">{r}%</Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {tab === "payment" && (
            <Card className="p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Payment Settings</h2>
              <Field label="UPI ID" defaultValue={STORE.upiId} />
              <Field label="Razorpay Key ID" defaultValue="rzp_live_••••••••" />
              <Field label="Bank Account No." defaultValue="HDFC ····4521" />
              <Field label="IFSC" defaultValue="HDFC0001234" />
              <div className="space-y-3 pt-3 border-t border-border/50">
                <Toggle label="Accept UPI" defaultChecked />
                <Toggle label="Accept Cards" defaultChecked />
                <Toggle label="Cash on Delivery" defaultChecked />
                <Toggle label="Credit / Khaata" desc="Allow customers to pay later" defaultChecked />
              </div>
            </Card>
          )}

          {tab === "notify" && (
            <Card className="p-6 space-y-3">
              <h2 className="font-display font-bold text-lg">Notification Triggers</h2>
              <Toggle label="WhatsApp order confirmation" desc="Send to customer when order is placed" defaultChecked />
              <Toggle label="WhatsApp shipped update" desc="Send when order is shipped" defaultChecked />
              <Toggle label="Daily sales summary at 9 PM" desc="Auto WhatsApp to owner" defaultChecked />
              <Toggle label="Low stock alert" desc="WhatsApp owner when stock drops below threshold" defaultChecked />
              <Toggle label="Payment due reminder (7 days)" defaultChecked />
              <Toggle label="Birthday & anniversary greetings" desc="Auto-send to customers with DOB" />
            </Card>
          )}

          {tab === "language" && (
            <Card className="p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Language Settings</h2>
              <div>
                <Label className="text-xs">Admin Interface</Label>
                <select className="mt-1.5 w-full h-10 rounded-md border border-input bg-white/60 px-3 text-sm">
                  <option>English</option><option>हिंदी</option><option>தமிழ்</option><option>తెలుగు</option><option>ಕನ್ನಡ</option><option>मराठी</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Customer Storefront Default</Label>
                <select className="mt-1.5 w-full h-10 rounded-md border border-input bg-white/60 px-3 text-sm">
                  <option>Auto-detect from browser</option><option>English</option><option>हिंदी</option>
                </select>
              </div>
              <Toggle label="Print invoices in store language" defaultChecked />
            </Card>
          )}

          {tab === "integrations" && (
            <Card className="p-6 space-y-3">
              <h2 className="font-display font-bold text-lg">Integrations</h2>
              {[
                { name: "WhatsApp Business API", desc: "Send order updates, reminders", connected: true },
                { name: "Razorpay", desc: "UPI / Cards / Netbanking", connected: true },
                { name: "Lovable AI Gateway", desc: "Powers AI Assistant (Claude / Gemini)", connected: true },
                { name: "GST e-invoice Portal", desc: "Auto-generate IRN", connected: false },
                { name: "Shiprocket", desc: "Delivery partner integration", connected: false },
              ].map(i => (
                <div key={i.name} className="flex items-center justify-between p-3 rounded-lg bg-white/40 border border-border/50">
                  <div>
                    <div className="font-semibold text-sm">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.desc}</div>
                  </div>
                  {i.connected ? (
                    <Badge className="bg-success/10 text-success border-0">Connected</Badge>
                  ) : (
                    <Button size="sm" variant="outline">Connect</Button>
                  )}
                </div>
              ))}
            </Card>
          )}

          {tab === "data" && (
            <Card className="p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Backup & Data Export</h2>
              <p className="text-sm text-muted-foreground">Download your full business data anytime. We auto-backup daily.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="text-left">
                    <div className="font-semibold">Export All Data (CSV)</div>
                    <div className="text-xs text-muted-foreground font-normal">Products, orders, parties, transactions</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="text-left">
                    <div className="font-semibold">Download ZIP Backup</div>
                    <div className="text-xs text-muted-foreground font-normal">Includes invoices PDF + images</div>
                  </div>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground pt-3 border-t border-border/50">
                Last auto-backup: Today at 3:00 AM IST · Next backup: Tomorrow 3:00 AM
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, className }: { label: string; defaultValue?: string; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <Input defaultValue={defaultValue} className="mt-1.5 bg-white/60" />
    </div>
  );
}

function Toggle({ label, desc, defaultChecked }: { label: string; desc?: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-white/40 border border-border/50">
      <div>
        <div className="font-medium text-sm">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
