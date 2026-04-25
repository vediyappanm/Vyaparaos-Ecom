import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Store, ScanLine, FileText, BarChart3, Sparkles, Globe, ShieldCheck,
  ArrowRight, IndianRupee, Boxes, MessageCircle, CheckCircle2, Zap,
} from "lucide-react";
import { formatINR } from "@/lib/format";

const FEATURES = [
  { icon: ScanLine, title: "Lightning POS", desc: "Touch-friendly billing with barcode scan, multi-tax, instant GST invoices.", color: "from-orange-500 to-red-500" },
  { icon: FileText, title: "GST-Compliant Invoices", desc: "HSN codes, CGST/SGST/IGST split, UPI QR, e-invoice ready.", color: "from-blue-500 to-indigo-600" },
  { icon: Boxes, title: "Smart Inventory", desc: "Low-stock alerts, stock movements, multi-location, barcode labels.", color: "from-emerald-500 to-teal-600" },
  { icon: Sparkles, title: "AI Assistant", desc: '"What was my best seller this week?" — answered in your language.', color: "from-violet-500 to-purple-600" },
  { icon: MessageCircle, title: "WhatsApp Automation", desc: "Order updates, payment reminders, daily sales — all on WhatsApp.", color: "from-green-500 to-emerald-600" },
  { icon: Globe, title: "6 Indian Languages", desc: "हिंदी, தமிழ், తెలుగు, ಕನ್ನಡ, मराठी, English — built-in.", color: "from-amber-500 to-orange-500" },
];

const PLANS = [
  { name: "Starter", price: 299, tag: "Best for new shops", features: ["Up to 100 products", "1 staff login", "GST invoices", "WhatsApp alerts"], popular: false },
  { name: "Growth", price: 699, tag: "Most popular", features: ["Unlimited products", "5 staff logins", "AI Assistant (basic)", "Voice billing", "Customer storefront"], popular: true },
  { name: "Pro", price: 1499, tag: "For growing brands", features: ["Everything in Growth", "Unlimited AI queries", "Custom domain", "Multi-location", "Priority support"], popular: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
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
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Login</Button>
            <Button size="sm" className="gradient-accent border-0 shadow-glow" asChild>
              <Link to="/admin">Open Demo <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,53,0.3),transparent_50%)]" />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-accent-glow" />
              India's first AI-native commerce OS
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-balance">
              Run your entire shop from <span className="text-accent-glow">one beautiful app</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/80 max-w-2xl mx-auto text-balance">
              Billing, inventory, GST invoices, WhatsApp orders, AI assistant, and a customer storefront — built for Indian SMBs, in your language.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gradient-accent border-0 shadow-glow text-base h-12 px-7" asChild>
                <Link to="/admin">
                  <ScanLine className="w-5 h-5 mr-2" />
                  Try the live demo
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white text-base h-12 px-7">
                Watch video (2 min)
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-white/70">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent-glow" /> 14-day free trial</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent-glow" /> No credit card</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent-glow" /> GST-ready</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent-glow" /> Works offline</div>
            </div>
          </div>

          {/* Stat strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { v: "12,400+", l: "Active stores" },
              { v: "₹420 Cr", l: "Sales processed" },
              { v: "6", l: "Indian languages" },
              { v: "4.8★", l: "Owner rating" },
            ].map(s => (
              <div key={s.l} className="text-center text-white">
                <div className="font-display font-bold text-2xl lg:text-3xl">{s.v}</div>
                <div className="text-xs text-white/70 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">Everything in one place</div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl mt-2 text-balance">
              Replace 5 apps with <span className="text-primary">one VyaparOS</span>
            </h2>
            <p className="text-muted-foreground mt-3 text-balance">
              Stop juggling Tally, BharatPe, WhatsApp, Excel, and your bahi-khaata. VyaparOS does it all.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
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

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">Simple pricing</div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl mt-2">Plans that fit your shop</h2>
            <p className="text-muted-foreground mt-3">Cancel anytime. All plans include GST invoicing and WhatsApp alerts.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLANS.map(p => (
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
                  {p.features.map(f => (
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

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden gradient-primary text-primary-foreground p-10 lg:p-14 text-center border-0">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative">
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
            <span>© 2026 VyaparOS · Made in India 🇮🇳</span>
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
