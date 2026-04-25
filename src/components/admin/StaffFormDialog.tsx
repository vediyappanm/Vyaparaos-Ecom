import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUpsertStaff, type DbStaff } from "@/hooks/useStaff";
import { toast } from "sonner";

export const StaffFormDialog = ({
  open, onOpenChange, staff,
}: { open: boolean; onOpenChange: (v: boolean) => void; staff?: Partial<DbStaff> }) => {
  const upsert = useUpsertStaff();
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (open) setForm(staff ?? { status: "active", role: "Helper" }); }, [open, staff]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name) return toast.error("Name required");
    try {
      await upsert.mutateAsync(form);
      toast.success("Saved"); onOpenChange(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{staff?.id ? "Edit" : "Add"} Staff</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2"><Label>Name *</Label><Input value={form.name ?? ""} onChange={e => set("name", e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} /></div>
          <div><Label>Role</Label>
            <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.role ?? "Helper"} onChange={e => set("role", e.target.value)}>
              <option>Cashier</option><option>Store Manager</option><option>Helper</option><option>Inventory Clerk</option><option>Delivery</option>
            </select>
          </div>
          <div><Label>Salary (₹/mo)</Label><Input type="number" value={form.salary ?? 0} onChange={e => set("salary", Number(e.target.value))} /></div>
          <div><Label>Join Date</Label><Input type="date" value={form.join_date ?? ""} onChange={e => set("join_date", e.target.value)} /></div>
          <div className="col-span-2"><Label>Status</Label>
            <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.status ?? "active"} onChange={e => set("status", e.target.value)}>
              <option value="active">Active</option><option value="on_leave">On Leave</option><option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={upsert.isPending} className="gradient-accent border-0 text-accent-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
