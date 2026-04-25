import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Calendar, IndianRupee, MoreVertical, Loader2, Pencil, Trash2 } from "lucide-react";
import { useStaff, useDeleteStaff, type DbStaff } from "@/hooks/useStaff";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { StaffFormDialog } from "@/components/admin/StaffFormDialog";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success", on_leave: "bg-warning/15 text-warning-foreground", inactive: "bg-muted text-muted-foreground",
};

export default function Staff() {
  const { data: staff = [], isLoading } = useStaff();
  const del = useDeleteStaff();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DbStaff | undefined>();

  const totalSalary = staff.reduce((s, m) => s + Number(m.salary), 0);
  const active = staff.filter(s => s.status === "active").length;

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    try { await del.mutateAsync(id); toast.success("Removed"); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="Team" title="Staff" description="Manage staff, roles and salaries"
        actions={<Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Staff</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 gradient-royal text-white border-0"><div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Total Staff</div>
          <div className="font-display font-bold text-2xl mt-1">{staff.length}</div></Card>
        <Card className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active</div>
          <div className="font-display font-bold text-2xl mt-1 text-success">{active}</div></Card>
        <Card className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Monthly Salary</div>
          <div className="font-display font-bold text-2xl mt-1">{formatINR(totalSalary, { decimals: false })}</div></Card>
        <Card className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">On Leave</div>
          <div className="font-display font-bold text-2xl mt-1">{staff.filter(s => s.status === "on_leave").length}</div></Card>
      </div>

      {isLoading ? <Card className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></Card>
        : staff.length === 0 ? <Card className="p-12 text-center text-sm text-muted-foreground">No staff yet — add your first team member.</Card>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {staff.map(s => (
            <Card key={s.id} className="p-5 hover:shadow-elevated transition-all">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl gradient-royal text-white flex items-center justify-center font-display font-bold text-lg shadow-elegant">
                  {s.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="mt-3"><h3 className="font-display font-semibold">{s.name}</h3>
                <div className="text-xs text-primary font-medium">{s.role}</div></div>
              <Badge className={cn("border-0 mt-2 capitalize", STATUS_STYLES[s.status])}>{s.status.replace("_", " ")}</Badge>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground border-t pt-3">
                {s.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{s.phone}</div>}
                {s.join_date && <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> Joined {new Date(s.join_date).toLocaleDateString("en-IN")}</div>}
                <div className="flex items-center gap-2"><IndianRupee className="w-3 h-3" />{formatINR(Number(s.salary), { decimals: false })}/mo</div>
              </div>
            </Card>
          ))}
        </div>}

      <StaffFormDialog open={open} onOpenChange={setOpen} staff={editing} />
    </div>
  );
}
