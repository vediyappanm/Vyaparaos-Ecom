import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, TrendingUp, ShoppingBag, Boxes, Users, Receipt,
  FileText, Wallet, Download, ArrowRight, Sparkles,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { SALES_TREND, KPIS } from "@/data/mockData";
import { formatINR, formatCompactINR } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";

const REPORTS = [
  { icon: TrendingUp, title: "Sales Report", desc: "Date-wise, party-wise, product-wise sales", color: "from-violet-500 to-purple-600" },
  { icon: ShoppingBag, title: "Purchase Report", desc: "Vendor-wise purchase summary", color: "from-blue-500 to-indigo-600" },
  { icon: Boxes, title: "Inventory Report", desc: "Current stock, valuation, movement", color: "from-emerald-500 to-teal-600" },
  { icon: Receipt, title: "GST Report", desc: "GSTR-1, GSTR-3B, B2B / B2C breakup", color: "from-amber-500 to-orange-500" },
  { icon: Users, title: "Party Ledger", desc: "Customer & vendor running balances", color: "from-pink-500 to-rose-600" },
  { icon: Wallet, title: "P&L Statement", desc: "Revenue, COGS, expenses, net profit", color: "from-yellow-500 to-amber-500" },
  { icon: BarChart3, title: "Cash Flow", desc: "Money in / out by account", color: "from-cyan-500 to-blue-600" },
  { icon: Users, title: "Staff Report", desc: "Attendance, salaries paid", color: "from-fuchsia-500 to-pink-600" },
];

export default function Reports() {
  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Every report you need to run your shop — exportable as CSV or PDF"
        actions={<Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Bulk Export</Button>}
      />

      {/* Snapshot */}
      <Card className="p-5 royal-orb-bg">
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div>
            <Badge className="bg-accent text-accent-foreground border-0 mb-2"><Sparkles className="w-3 h-3 mr-1" /> April 2026</Badge>
            <h2 className="font-display font-bold text-xl">Monthly Snapshot</h2>
            <p className="text-sm text-muted-foreground">Quick view of your business this month</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</div>
                <div className="font-display font-bold text-lg text-success">{formatCompactINR(KPIS.monthRevenue)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Expenses</div>
                <div className="font-display font-bold text-lg text-destructive">{formatCompactINR(KPIS.monthExpenses)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Profit</div>
                <div className="font-display font-bold text-lg text-gold">{formatCompactINR(KPIS.netProfit)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Margin</div>
                <div className="font-display font-bold text-lg">29.5%</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SALES_TREND}>
                <defs>
                  <linearGradient id="lineGold" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(265 60% 45%)" />
                    <stop offset="100%" stopColor="hsl(43 80% 55%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatINR(v, { decimals: false })} />
                <Line type="monotone" dataKey="sales" stroke="url(#lineGold)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORTS.map(r => (
          <Card key={r.title} className="p-5 group hover:shadow-elevated hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
              <r.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-display font-semibold mt-3">{r.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary group-hover:text-accent transition-colors">
              View report <ArrowRight className="w-3 h-3" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
