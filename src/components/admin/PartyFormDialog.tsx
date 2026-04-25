import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpsertParty, type DbParty } from "@/hooks/useParties";
import { toast } from "sonner";

export const PartyFormDialog = ({
  open, onOpenChange, party, defaultType = "customer",
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  party?: Partial<DbParty>; defaultType?: "customer" | "vendor";
}) => {
  const upsert = useUpsertParty();
  const [form, setForm] = useState<any>({ type: defaultType });

  useEffect(() => { if (open) setForm(party ?? { type: defaultType }); }, [open, party, defaultType]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name) return toast.error("Name is required");
    try {
      await upsert.mutateAsync(form);
      toast.success(party?.id ? "Party updated" : "Party added");
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{party?.id ? "Edit" : "Add"} {form.type === "vendor" ? "Vendor" : "Customer"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2">
            <Label>Type</Label>
            <select className="mt-1.5 w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.type ?? "customer"} onChange={e => set("type", e.target.value)}>
              <option value="customer">Customer</option><option value="vendor">Vendor</option>
            </select>
          </div>
          <div className="col-span-2"><Label>Name *</Label><Input value={form.name ?? ""} onChange={e => set("name", e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} /></div>
          <div><Label>Email</Label><Input value={form.email ?? ""} onChange={e => set("email", e.target.value)} /></div>
          <div><Label>GSTIN</Label><Input value={form.gstin ?? ""} onChange={e => set("gstin", e.target.value)} /></div>
          <div><Label>Opening Balance</Label><Input type="number" value={form.opening_balance ?? 0} onChange={e => set("opening_balance", Number(e.target.value))} /></div>
          <div className="col-span-2"><Label>Address</Label><Input value={form.address ?? ""} onChange={e => set("address", e.target.value)} /></div>
          <div><Label>City</Label><Input value={form.city ?? ""} onChange={e => set("city", e.target.value)} /></div>
          <div><Label>State</Label><Input value={form.state ?? ""} onChange={e => set("state", e.target.value)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={upsert.isPending} className="gradient-accent border-0 text-accent-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
