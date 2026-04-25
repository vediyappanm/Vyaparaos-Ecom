import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Phone, Calendar, IndianRupee, Loader2, Pencil, Trash2, UserPlus, Copy, Check, Crown, Users } from "lucide-react";
import { useStaff, useDeleteStaff, type DbStaff } from "@/hooks/useStaff";
import { useInvites, useDeleteInvite, useMembers, useUpdateMemberRole, useRemoveMember } from "@/hooks/useInvites";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { StaffFormDialog } from "@/components/admin/StaffFormDialog";
import { InviteDialog } from "@/components/admin/InviteDialog";
import { useTenant, type AppRole } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success", on_leave: "bg-warning/15 text-warning-foreground", inactive: "bg-muted text-muted-foreground",
};

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-accent/15 text-accent-foreground border-accent/30",
  manager: "bg-primary/10 text-primary border-primary/20",
  cashier: "bg-success/10 text-success border-success/20",
  staff: "bg-muted text-muted-foreground border-border",
};

export default function Staff() {
  const { user } = useAuth();
  const { isOwner, isManager } = useTenant();
  const { data: staff = [], isLoading } = useStaff();
  const { data: members = [] } = useMembers();
  const { data: invites = [] } = useInvites();
  const del = useDeleteStaff();
  const delInvite = useDeleteInvite();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DbStaff | undefined>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const totalSalary = staff.reduce((s, m) => s + Number(m.salary), 0);
  const active = staff.filter(s => s.status === "active").length;

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    try { await del.mutateAsync(id); toast.success("Removed"); } catch (e: any) { toast.error(e.message); }
  };

  const copyInvite = async (code: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
    toast.success("Invite link copied");
  };

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Team"
        title="Staff & Members"
        description="Invite teammates with login access or track salaried staff records"
        actions={
          <div className="flex gap-2">
            {isManager && (
              <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                <UserPlus className="w-4 h-4 mr-1.5" /> Invite Member
              </Button>
            )}
            <Button size="sm" className="gradient-accent border-0 shadow-glow text-accent-foreground" onClick={() => { setEditing(undefined); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Staff
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 gradient-royal text-white border-0">
          <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">App Members</div>
          <div className="font-display font-bold text-2xl mt-1">{members.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Salaried Staff</div>
          <div className="font-display font-bold text-2xl mt-1">{staff.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active</div>
          <div className="font-display font-bold text-2xl mt-1 text-success">{active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Monthly Salary</div>
          <div className="font-display font-bold text-2xl mt-1">{formatINR(totalSalary, { decimals: false })}</div>
        </Card>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members"><Users className="w-3.5 h-3.5 mr-1.5" /> App Members</TabsTrigger>
          <TabsTrigger value="invites">Pending Invites {invites.filter(i => !i.accepted_at).length > 0 && <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">{invites.filter(i => !i.accepted_at).length}</Badge>}</TabsTrigger>
          <TabsTrigger value="salaried">Salaried Staff</TabsTrigger>
        </TabsList>

        {/* MEMBERS WITH LOGIN */}
        <TabsContent value="members" className="space-y-3 mt-4">
          {members.length === 0 ? (
            <Card className="p-12 text-center text-sm text-muted-foreground">No members yet. Click Invite Member to add one.</Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground bg-muted/40">
                  <tr>
                    <th className="text-left font-medium py-3 px-4">Member</th>
                    <th className="text-left font-medium py-3 px-4">Role</th>
                    <th className="text-left font-medium py-3 px-4 hidden md:table-cell">Joined</th>
                    {isOwner && <th className="text-right font-medium py-3 px-4">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => {
                    const isMe = m.user_id === user?.id;
                    const isOwnerRow = m.role === "owner";
                    return (
                      <tr key={m.user_id} className="hover:bg-muted/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-royal text-white flex items-center justify-center text-xs font-bold">
                              {(m.full_name ?? "U").split(" ").map(n => n[0]).slice(0, 2).join("")}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">{m.full_name ?? "Member"} {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}</div>
                              {isOwnerRow && <div className="text-[10px] text-accent-foreground flex items-center gap-1"><Crown className="w-3 h-3 text-accent" /> Workspace owner</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isOwner && !isOwnerRow && !isMe ? (
                            <select
                              value={m.role}
                              onChange={async (e) => {
                                try { await updateRole.mutateAsync({ user_id: m.user_id, role: e.target.value as AppRole }); toast.success("Role updated"); }
                                catch (err: any) { toast.error(err.message); }
                              }}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize"
                            >
                              <option value="manager">Manager</option>
                              <option value="cashier">Cashier</option>
                              <option value="staff">Staff</option>
                            </select>
                          ) : (
                            <Badge variant="outline" className={cn("capitalize", ROLE_STYLES[m.role])}>{m.role}</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">{new Date(m.joined_at).toLocaleDateString("en-IN")}</td>
                        {isOwner && (
                          <td className="py-3 px-4 text-right">
                            {!isOwnerRow && !isMe && (
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                                if (!confirm("Remove this member's access?")) return;
                                try { await removeMember.mutateAsync(m.user_id); toast.success("Removed"); }
                                catch (e: any) { toast.error(e.message); }
                              }}><Trash2 className="w-3.5 h-3.5" /></Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        {/* PENDING INVITES */}
        <TabsContent value="invites" className="space-y-3 mt-4">
          {invites.length === 0 ? (
            <Card className="p-12 text-center text-sm text-muted-foreground">No invites yet.</Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground bg-muted/40">
                  <tr>
                    <th className="text-left font-medium py-3 px-4">Code</th>
                    <th className="text-left font-medium py-3 px-4">Role</th>
                    <th className="text-left font-medium py-3 px-4 hidden md:table-cell">For</th>
                    <th className="text-left font-medium py-3 px-4">Status</th>
                    <th className="text-right font-medium py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invites.map((i) => {
                    const expired = new Date(i.expires_at) < new Date();
                    const accepted = !!i.accepted_at;
                    return (
                      <tr key={i.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{i.code}</td>
                        <td className="py-3 px-4"><Badge variant="outline" className={cn("capitalize", ROLE_STYLES[i.role])}>{i.role}</Badge></td>
                        <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">{i.email ?? i.note ?? "—"}</td>
                        <td className="py-3 px-4">
                          {accepted ? <Badge className="bg-success/10 text-success border-0">Accepted</Badge>
                            : expired ? <Badge variant="outline" className="text-muted-foreground">Expired</Badge>
                            : <Badge variant="outline" className="bg-warning/15">Pending · expires {new Date(i.expires_at).toLocaleDateString("en-IN")}</Badge>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex gap-1">
                            {!accepted && !expired && (
                              <Button variant="ghost" size="sm" onClick={() => copyInvite(i.code)}>
                                {copiedCode === i.code ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                            )}
                            {isManager && (
                              <Button variant="ghost" size="sm" className="text-destructive"
                                onClick={async () => { try { await delInvite.mutateAsync(i.id); toast.success("Invite revoked"); } catch (e: any) { toast.error(e.message); } }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        {/* SALARIED STAFF (legacy non-login records) */}
        <TabsContent value="salaried" className="space-y-3 mt-4">
          {isLoading ? <Card className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></Card>
            : staff.length === 0 ? <Card className="p-12 text-center text-sm text-muted-foreground">No staff records yet.</Card>
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
        </TabsContent>
      </Tabs>

      <StaffFormDialog open={open} onOpenChange={setOpen} staff={editing} />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
