import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateInvite } from "@/hooks/useInvites";
import { useTenant, type AppRole } from "@/contexts/TenantContext";
import { Copy, Check, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ROLES: { value: AppRole; label: string; desc: string }[] = [
  { value: "manager", label: "Manager", desc: "Full access except billing & ownership" },
  { value: "cashier", label: "Cashier", desc: "POS, orders, parties, invoices" },
  { value: "staff", label: "Staff", desc: "View-only access to most modules" },
];

export const InviteDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { tenant } = useTenant();
  const create = useCreateInvite();
  const [role, setRole] = useState<AppRole>("cashier");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const join = code ? `${window.location.origin}/join/${code}` : "";

  const submit = async () => {
    try {
      const inv = await create.mutateAsync({ role, email: email || undefined, note: note || undefined });
      setCode(inv.code);
      toast.success("Invite link generated");
    } catch (e: any) { toast.error(e.message); }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(join);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = () => {
    const text = `You're invited to join ${tenant?.name} on VyaparOS as ${role}.\n\nJoin here: ${join}\nOr use code: ${code}`;
    if (navigator.share) navigator.share({ title: `Join ${tenant?.name}`, text });
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const reset = () => { setCode(null); setEmail(""); setNote(""); setRole("cashier"); };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{code ? "Invite ready" : "Invite team member"}</DialogTitle>
          <DialogDescription>
            {code ? "Share this link or code. Valid for 14 days." : "Generate a one-time join link with a specific role."}
          </DialogDescription>
        </DialogHeader>

        {!code ? (
          <div className="space-y-3 py-2">
            <div>
              <Label>Role</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${role === r.value ? "border-accent bg-accent/5 ring-1 ring-accent/40" : "border-border hover:border-primary/40"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm capitalize">{r.label}</div>
                      {role === r.value && <Check className="w-4 h-4 text-accent" />}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" />
              <p className="text-[11px] text-muted-foreground mt-1">For your reference. We don't send emails — share the link manually.</p>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Counter 2 cashier" />
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="p-4 rounded-lg bg-muted/40 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Join Code</div>
              <div className="font-mono font-bold text-2xl tracking-widest text-primary mt-1">{code}</div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="capitalize">{role}</Badge>
                <Badge variant="outline">14-day expiry</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly value={join} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copy}>{copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}</Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!code ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={submit} disabled={create.isPending} className="gradient-accent border-0 text-accent-foreground">
                {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate invite
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => { reset(); }}>Create another</Button>
              <Button onClick={share} className="gradient-accent border-0 text-accent-foreground">
                <Share2 className="w-4 h-4 mr-1.5" /> Share via WhatsApp
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
