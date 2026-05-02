import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Store, ScanLine, FileText, Sparkles, Globe, ShieldCheck,
  ArrowRight, Boxes, MessageCircle, CheckCircle2, Zap,
  Activity, Wallet, ShoppingCart, TrendingUp,
} from "lucide-react";
import { formatINR } from "@/lib/format";

const FEATURES = [
  { icon: ScanLine, title: "Lightning POS", desc: "Touch-friendly billing with barcode scan, multi-tax, instant GST invoices.", color: "from-orange-500 to-red-500" },
  { icon: FileText, title: "GST-Compliant Invoices", desc: "HSN codes, CGST/SGST/IGST split, UPI QR, e-invoice ready.", color: "from-blue-500 to-indigo-600" },
  { icon: Boxes, title: "Smart Inventory", desc: "Low-stock alerts, stock movements, multi-location, barcode labels.", color: "from-emerald-500 to-teal-600" },
  { icon: Sparkles, title: "AI Assistant", desc: '"What was my best seller this week?" - answered in your language.', color: "from-violet-500 to-purple-600" },
  { icon: MessageCircle, title: "WhatsApp Automation", desc: "Order updates, payment reminders, daily sales - all on WhatsApp.", color: "from-green-500 to-emerald-600" },
  { icon: Globe, title: "6 Indian Languages", desc: "Hindi, Tamil, Telugu, Kannada, Marathi, English - built-in.", color: "from-amber-500 to-orange-500" },
];

const PLANS = [
  { name: "Starter", price: 299, tag: "Best for new shops", features: ["Up to 100 products", "1 staff login", "GST invoices", "WhatsApp alerts"], popular: false },
  { name: "Growth", price: 699, tag: "Most popular", features: ["Unlimited products", "5 staff logins", "AI Assistant (basic)", "Voice billing", "Customer storefront"], popular: true },
  { name: "Pro", price: 1499, tag: "For growing brands", features: ["Everything in Growth", "Unlimited AI queries", "Custom domain", "Multi-location", "Priority support"], popular: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center shadow-glow">
              <Store className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-tight">VyaparOS</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground -mt-0.5">Commerce OS for Bharat</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#" className="hover:text-foreground">For Customers</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button size="sm" className="gradient-accent border-0 shadow-glow" asChild>
              <Link to="/admin">Open Demo <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden gradient-hero">
        <div className="relative container mx-auto px-4 py-14 lg:py-20">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-start">
            <div className="text-white pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5 text-accent-glow" />
                AI-native commerce platform for modern Indian retailers
              </div>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.04] tracking-tight text-balance">
                Run sales, stock, and finance from <span className="text-accent-glow">one control panel</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-white/80 max-w-2xl text-balance">
                Fast billing, barcode operations, GST compliance, WhatsApp commerce, and AI insights in a single operating system built for business teams.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="gradient-accent border-0 shadow-glow text-base h-12 px-7" asChild>
                  <Link to="/admin">
                    <ScanLine className="w-5 h-5 mr-2" />
                    Open interactive demo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white text-base h-12 px-7">
                  View 2-min product tour
                </Button>
              </div>
              <div className="mt-8 grid sm:grid-cols-2 gap-2.5 text-xs text-white/80 max-w-xl">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent-glow" /> 14-day free trial</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent-glow" /> No credit card needed</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent-glow" /> GST-ready workflows</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent-glow" /> Multi-store ready</div>
              </div>
            </div>

            <div className="glass-dark rounded-lg p-4 lg:p-5 border border-white/20 shadow-royal">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/60">Live business panel</div>
                  <div className="text-white font-semibold mt-0.5">Today at a glance</div>
                </div>
                <span className="px-2 py-1 rounded-md bg-emerald-400/20 text-emerald-200 text-xs font-medium">Online</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between text-white/70 text-xs"><span>Net Sales</span><Wallet className="w-4 h-4" /></div>
                  <div className="text-white text-xl font-bold mt-1">{formatINR(124590, { decimals: false })}</div>
                  <div className="text-emerald-200 text-xs mt-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +18% vs yesterday</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between text-white/70 text-xs"><span>Orders</span><ShoppingCart className="w-4 h-4" /></div>
                  <div className="text-white text-xl font-bold mt-1">126</div>
                  <div className="text-white/70 text-xs mt-1">9 pending dispatch</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between text-white/70 text-xs"><span>Scan Accuracy</span><Activity className="w-4 h-4" /></div>
                  <div className="text-white text-xl font-bold mt-1">99.2%</div>
                  <div className="text-white/70 text-xs mt-1">Across 4 store devices</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between text-white/70 text-xs"><span>GST Ready</span><ShieldCheck className="w-4 h-4" /></div>
                  <div className="text-white text-xl font-bold mt-1">100%</div>
                  <div className="text-white/70 text-xs mt-1">Invoice compliance status</div>
                </div>
              </div>
              <div className="mt-4 bg-white/10 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/70 mb-2">Top SKU momentum</div>
                <div className="space-y-2">
                  {[
                    { sku: "RICE-25KG", value: 86 },
                    { sku: "OIL-1L", value: 72 },
                    { sku: "SUGAR-5KG", value: 64 },
                  ].map((item) => (
                    <div key={item.sku}>
                      <div className="flex justify-between text-xs text-white/85"><span>{item.sku}</span><span>{item.value}%</span></div>
                      <div className="mt-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-full gradient-accent" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { v: "12,400+", l: "Active stores" },
              { v: "Rs 420 Cr", l: "Sales processed" },
              { v: "6", l: "Indian languages" },
              { v: "4.8/5", l: "Owner rating" },
            ].map((s) => (
              <div key={s.l} className="glass-dark rounded-lg px-4 py-3 border border-white/10 text-white">
                <div className="font-display font-bold text-xl lg:text-2xl">{s.v}</div>
                <div className="text-xs text-white/70 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">Everything in one place</div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl mt-2 text-balance">
              Replace 5 apps with <span className="text-primary">one VyaparOS</span>
            </h2>
            <p className="text-muted-foreground mt-3 text-balance">
              Stop juggling Tally, BharatPe, WhatsApp, Excel, and your notebook. VyaparOS does it all.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.title} className="p-6 hover:shadow-elegant transition-all hover:-translate-y-1 group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg mt-4">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 lg:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">Simple pricing</div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl mt-2">Plans that fit your shop</h2>
            <p className="text-muted-foreground mt-3">Cancel anytime. All plans include GST invoicing and WhatsApp alerts.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLANS.map((p) => (
              <Card key={p.name} className={`relative p-6 ${p.popular ? "border-accent border-2 shadow-elevated" : ""}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider shadow-glow">
                    Most Popular
                  </div>
                )}
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.tag}</div>
                <h3 className="font-display font-bold text-2xl mt-1">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display font-extrabold text-4xl">{formatINR(p.price, { decimals: false })}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <Button className={`w-full mt-5 ${p.popular ? "gradient-accent border-0 shadow-glow" : ""}`} variant={p.popular ? "default" : "outline"}>
                  Start free trial
                </Button>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="gradient-primary text-primary-foreground p-10 lg:p-14 text-center border-0">
            <div>
              <Zap className="w-10 h-10 mx-auto text-accent-glow" />
              <h2 className="font-display font-bold text-3xl lg:text-4xl mt-4 text-balance">
                Your shop deserves better tools
              </h2>
              <p className="mt-3 text-white/80 max-w-xl mx-auto">
                Join thousands of Indian SMBs already running their business on VyaparOS.
              </p>
              <Button size="lg" className="mt-7 gradient-accent border-0 shadow-glow text-base h-12 px-7" asChild>
                <Link to="/admin">
                  Open the live demo <ArrowRight className="w-5 h-5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-accent flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-accent-foreground" />
            </div>
            <span>© 2026 VyaparOS · Made in India</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
