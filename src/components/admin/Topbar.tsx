import { Search, ChevronDown, Crown, LogOut, Settings, Store, Check, Building2 } from "lucide-react";
import { NotificationsBell } from "./NotificationsBell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useNavigate, Link } from "react-router-dom";

const roleColor: Record<string, string> = {
  owner: "bg-accent/15 text-accent-foreground border-accent/30",
  manager: "bg-primary/10 text-primary border-primary/20",
  cashier: "bg-success/10 text-success border-success/20",
  staff: "bg-muted text-muted-foreground border-border",
};

export const Topbar = () => {
  const { user, signOut } = useAuth();
  const { tenant, role, memberships, switchTenant } = useTenant();
  const nav = useNavigate();

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "U")
    .split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    nav("/auth", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-white/40">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-14">
        {/* Tenant switcher (desktop) */}
        {memberships.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/40 transition-colors">
                <div className="w-7 h-7 rounded-md gradient-royal text-white flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Workspace</div>
                  <div className="text-xs font-semibold leading-tight max-w-[140px] truncate">{tenant?.name ?? "—"}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Your workspaces</DropdownMenuLabel>
              {memberships.map((m) => (
                <DropdownMenuItem key={m.tenant_id} onClick={() => switchTenant(m.tenant_id)} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{m.tenant_name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{m.role}</div>
                    </div>
                  </div>
                  {m.tenant_id === tenant?.id && <Check className="w-4 h-4 text-accent shrink-0" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/onboarding"><Building2 className="w-4 h-4 mr-2" /> Create new workspace</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products, orders, customers..." className="pl-9 h-9 bg-white/40 border-white/40 focus-visible:bg-white/70" />
          </div>
        </div>
        <div className="flex-1 md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-accent-foreground" />
          </div>
          <div className="font-display font-bold text-sm text-primary truncate">{tenant?.name ?? "VyaparOS"}</div>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <NotificationsBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 border-l border-white/30 hover:opacity-90">
                <div className="w-9 h-9 rounded-full gradient-royal text-white flex items-center justify-center text-xs font-bold ring-1 ring-accent/50 shadow-glow">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold leading-tight">{user?.user_metadata?.full_name ?? user?.email}</div>
                  {role && <Badge variant="outline" className={`text-[9px] px-1.5 py-0 capitalize mt-0.5 ${roleColor[role]}`}>{role}</Badge>}
                </div>
                <ChevronDown className="w-3 h-3 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm font-semibold">{user?.email}</div>
                {tenant && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Store className="w-3 h-3" /> {tenant.name}</div>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/admin/settings"><Settings className="w-4 h-4 mr-2" /> Settings</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
