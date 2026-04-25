import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Calendar, IndianRupee, MoreVertical } from "lucide-react";
import { STAFF } from "@/data/mockData";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-success/10 text-success",
  "On Leave": "bg-warning/15 text-warning-foreground",
  Inactive: "bg-muted text-muted-foreground",
};

export default function Staff() {
  const totalSalary = STAFF.reduce((s, m) => s + m.salary, 0);
  const active = STAFF.filter(s => s.status === "Active").length;

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Team"
        title="Staff"
        description="Manage staff, roles, attendance and salaries"
        actions={
          <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground">
            <Plus className="w-4 h-4 mr-1.5" /> Add Staff
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 gradient-royal text-white border-0 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-accent/30 blur-2xl" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Total Staff</div>
            <div className="font-display font-bold text-2xl mt-1">{STAFF.length}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active Today</div>
          <div className="font-display font-bold text-2xl mt-1 text-success">{active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Monthly Salary</div>
          <div className="font-display font-bold text-2xl mt-1">{formatINR(totalSalary, { decimals: false })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pending Salary</div>
          <div className="font-display font-bold text-2xl mt-1 text-destructive">{formatINR(28000, { decimals: false })}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {STAFF.map(s => (
          <Card key={s.id} className="p-5 hover:shadow-elevated transition-all">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl gradient-royal text-white flex items-center justify-center font-display font-bold text-lg shadow-elegant ring-1 ring-accent/40">
                {s.avatar}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
            </div>
            <div className="mt-3">
              <h3 className="font-display font-semibold">{s.name}</h3>
              <div className="text-xs text-gold font-medium">{s.role}</div>
            </div>
            <Badge className={cn("border-0 mt-2", STATUS_STYLES[s.status])}>{s.status}</Badge>
            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-3">
              <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {s.phone}</div>
              <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> Joined {s.joinDate}</div>
              <div className="flex items-center gap-2"><IndianRupee className="w-3 h-3" /> {formatINR(s.salary, { decimals: false })}/mo</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
