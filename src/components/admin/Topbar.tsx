import { Search, ChevronDown, Crown, LogOut, Settings, Store, Check, Building2, ScanLine, Plus } from "lucide-react";
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
  owner: "border-accent/35 bg-accent/[0.12] text-accent-foreground",
  manager: "border-primary/20 bg-primary/[0.08] text-primary",
  cashier: "border-success/20 bg-success/10 text-success",
  staff: "border-border bg-muted text-muted-foreground",
};

export const Topbar = () => {
  const { user, signOut } = useAuth();
  const { tenant, role, memberships, switchTenant } = useTenant();
  const nav = useNavigate();

  const displayName = user?.full_name || user?.email || "User";
  const initials = displayName
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    nav("/auth", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        {memberships.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 shadow-sm transition-colors hover:bg-muted/50 md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-royal text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Workspace</div>
                  <div className="max-w-[168px] truncate text-xs font-semibold leading-tight">{tenant?.name ?? "Select workspace"}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Your workspaces</DropdownMenuLabel>
              {memberships.map((m) => (
                <DropdownMenuItem key={m.tenant_id} onClick={() => switchTenant(m.tenant_id)} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{m.tenant_name}</div>
                      <div className="text-[10px] capitalize text-muted-foreground">{m.role}</div>
                    </div>
                  </div>
                  {m.tenant_id === tenant?.id && <Check className="h-4 w-4 shrink-0 text-accent" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/onboarding"><Building2 className="mr-2 h-4 w-4" /> Create new workspace</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="hidden flex-1 items-center gap-2 md:flex">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, orders, parties..."
              className="h-10 rounded-lg border-border bg-card pl-9 text-sm shadow-sm focus-visible:bg-white"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent">
            <Crown className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold text-primary">{tenant?.name ?? "VyaparOS"}</div>
            <div className="text-[10px] text-muted-foreground">Admin workspace</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button className="hidden h-10 gap-2 rounded-lg gradient-accent px-3 text-accent-foreground shadow-glow sm:inline-flex" asChild>
            <Link to="/admin/pos"><ScanLine className="h-4 w-4" /> New Sale</Link>
          </Button>
          <Button variant="outline" size="icon" className="hidden h-10 w-10 rounded-lg bg-card sm:inline-flex" asChild>
            <Link to="/admin/products"><Plus className="h-4 w-4" /></Link>
          </Button>
          <NotificationsBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-border bg-card py-1.5 pl-1.5 pr-2 shadow-sm transition-colors hover:bg-muted/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-royal text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="hidden max-w-[180px] text-left sm:block">
                  <div className="truncate text-xs font-semibold leading-tight">{displayName}</div>
                  {role && <Badge variant="outline" className={`mt-0.5 px-1.5 py-0 text-[9px] capitalize ${roleColor[role]}`}>{role}</Badge>}
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="text-sm font-semibold">{user?.email}</div>
                {tenant && <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Store className="h-3 w-3" /> {tenant.name}</div>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
