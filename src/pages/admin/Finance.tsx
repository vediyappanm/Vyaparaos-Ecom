import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Banknote, Landmark, Smartphone, Plus, ArrowDownRight, ArrowUpRight,
  TrendingUp, Receipt, Wallet, ArrowRightLeft,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ACCOUNTS, TRANSACTIONS, EXPENSE_BREAKDOWN, KPIS, SALES_TREND } from "@/data/mockData";
import { formatINR, formatCompactINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";

const ICONS: Record<string, any> = { Banknote, Landmark, Smartphone };

const TYPE_STYLES: Record<string, string> = {
  Receipt: "bg-success/10 text-success",
  Income: "bg-success/10 text-success",
  Payment: "bg-destructive/10 text-destructive",
  Expense: "bg-warning/15 text-warning-foreground",
};

export default function Finance() {
  const totalCash = ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = EXPENSE_BREAKDOWN.reduce((s, e) => s + e.amount, 0);
  const monthlyData = SALES_TREND.slice(-7).map(d => ({
    date: d.date,
    Revenue: d.sales,
    Expenses: Math.round(d.sales * 0.42),
    Profit: Math.round(d.sales * 0.58),
  }));

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Money"
        title="Finance"
        description="Cash, bank, expenses and profit & loss at a glance"
        actions={
          <>
            <Button variant="outline" size="sm"><ArrowRightLeft className="w-4 h-4 mr-1.5" /> Transfer</Button>
            <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground">
              <Plus className="w-4 h-4 mr-1.5" /> Add Transaction
            </Button>
          </>
        }
      />

      {/* Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACCOUNTS.map((a, i) => {
          const Icon = ICONS[a.icon] || Wallet;
          return (
            <Card key={a.name} className={cn(
              "p-5 relative overflow-hidden",
              i === 0 && "gradient-royal text-white border-0"
            )}>
              {i === 0 && <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-accent/30 blur-2xl" />}
              <div className="relative flex items-start justify-between">
                <div>
                  <div className={cn("text-[10px] uppercase tracking-wider font-semibold", i === 0 ? "text-white/70" : "text-muted-foreground")}>
                    {a.name}
                  </div>
                  <div className="font-display font-bold text-2xl mt-1.5">{formatINR(a.balance, { decimals: false })}</div>
                  <div className={cn("text-[11px] mt-1", i === 0 ? "text-accent-glow" : "text-success")}>
                    +{formatINR(8420, { decimals: false })} this week
                  </div>
                </div>
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                  i === 0 ? "bg-white/15" : "bg-primary/10 text-primary"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-lg">Profit & Loss</h2>
              <p className="text-xs text-muted-foreground">Last 7 days · Net profit {formatCompactINR(KPIS.netProfit)}</p>
            </div>
            <Badge className="bg-success/10 text-success border-0"><TrendingUp className="w-3 h-3 mr-1" /> +18.4%</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatINR(v, { decimals: false })} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Revenue" fill="hsl(265 60% 35%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="hsl(348 70% 60%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Profit" fill="hsl(43 80% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display font-semibold text-lg">Expense Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-2">This month · {formatINR(totalExpenses, { decimals: false })}</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={EXPENSE_BREAKDOWN} dataKey="amount" nameKey="category" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {EXPENSE_BREAKDOWN.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatINR(v, { decimals: false })} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {EXPENSE_BREAKDOWN.map(e => (
              <div key={e.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: e.color }} />
                  <span>{e.category}</span>
                </div>
                <span className="font-mono font-semibold">{formatINR(e.amount, { decimals: false })}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Day book */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-accent" /> Day Book
            </h2>
            <p className="text-xs text-muted-foreground">All transactions · Cash in {formatINR(totalCash, { decimals: false })}</p>
          </div>
          <Button variant="ghost" size="sm">View all →</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground bg-white/30">
              <tr>
                <th className="text-left font-semibold py-2.5 px-4">Date</th>
                <th className="text-left font-semibold py-2.5">Type</th>
                <th className="text-left font-semibold py-2.5">Party / Category</th>
                <th className="text-left font-semibold py-2.5 hidden md:table-cell">Account</th>
                <th className="text-left font-semibold py-2.5 hidden lg:table-cell">Mode</th>
                <th className="text-right font-semibold py-2.5 px-4">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {TRANSACTIONS.map(t => {
                const isIn = t.type === "Receipt" || t.type === "Income";
                return (
                  <tr key={t.id} className="hover:bg-white/40">
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">{t.date}</td>
                    <td className="py-2.5">
                      <Badge className={cn("border-0 gap-1", TYPE_STYLES[t.type])}>
                        {isIn ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {t.type}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <div className="font-medium">{t.party || t.category}</div>
                      {t.notes && <div className="text-[10px] text-muted-foreground">{t.notes}</div>}
                    </td>
                    <td className="py-2.5 text-xs hidden md:table-cell">{t.account}</td>
                    <td className="py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{t.mode}</td>
                    <td className={cn("py-2.5 px-4 text-right font-display font-bold", isIn ? "text-success" : "text-destructive")}>
                      {isIn ? "+" : "−"}{formatINR(t.amount, { decimals: false })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
