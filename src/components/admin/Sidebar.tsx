import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Wallet,
  UserCog, FileText, BarChart3, Sparkles, Settings, Crown,
  ScanLine, Boxes, ChevronRight, ShoppingBag, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant, type AppRole } from "@/contexts/TenantContext";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  highlight?: boolean;
  roles?: AppRole[];
};

const CORE: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/pos", label: "New Sale", icon: ScanLine, highlight: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
];

const OPERATIONS: NavItem[] = [
  { to: "/admin/products", label: "Products", icon: Package, roles: ["owner", "manager"] },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, roles: ["owner", "manager"] },
  { to: "/admin/purchases", label: "Purchases", icon: ShoppingBag, roles: ["owner", "manager"] },
  { to: "/admin/parties", label: "Parties", icon: Users },
  { to: "/admin/finance", label: "Finance", icon: Wallet, roles: ["owner", "manager"] },
  { to: "/admin/staff", label: "Staff", icon: UserCog, roles: ["owner", "manager"] },
];

const INSIGHTS: NavItem[] = [
  { to: "/admin/reports", label: "Reports", icon: BarChart3, roles: ["owner", "manager"] },
  { to: "/admin/audit", label: "Activity Log", icon: Activity, roles: ["owner", "manager"] },
  { to: "/admin/ai", label: "AI Assistant", icon: Sparkles },
  { to: "/admin/settings", label: "Settings", icon: Settings, roles: ["owner"] },
];

const groups = [
  { label: "Run", items: CORE },
  { label: "Manage", items: OPERATIONS },
  { label: "Review", items: INSIGHTS },
];

const NavRow = ({ item }: { item: NavItem }) => {
  const { to, label, icon: Icon, end, highlight } = item;

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          isActive
            ? "bg-white text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/85 hover:bg-white/[0.12] hover:text-white",
          highlight && !isActive && "bg-sidebar-primary/[0.12] text-sidebar-primary ring-1 ring-sidebar-primary/25 hover:bg-sidebar-primary/[0.16]"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              isActive ? "bg-sidebar-primary/15 text-sidebar-primary-foreground" : "bg-white/[0.08] text-inherit",
              highlight && !isActive && "bg-sidebar-primary/[0.18]"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <ChevronRight className={cn("h-3.5 w-3.5 opacity-0 transition-opacity", isActive ? "opacity-50" : "group-hover:opacity-45")} />
        </>
      )}
    </NavLink>
  );
};

export const Sidebar = () => {
  const { tenant, role } = useTenant();

  return (
    <aside className="hidden lg:flex h-screen w-[272px] shrink-0 flex-col sticky top-0 z-30 bg-sidebar text-sidebar-foreground">
      <div className="absolute inset-y-0 right-0 w-px bg-white/10" />

      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg gradient-accent shadow-glow">
            <Crown className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-bold leading-tight text-white">VyaparOS</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-primary">Commerce OS</div>
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-lg border border-white/10 bg-white/[0.055] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Workspace</div>
          {role && (
            <span className="rounded bg-sidebar-primary/[0.14] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sidebar-primary">
              {role}
            </span>
          )}
        </div>
        <div className="mt-1 truncate text-sm font-semibold text-white">{tenant?.name ?? "No workspace"}</div>
        <div className="mt-0.5 truncate font-mono text-[10px] text-white/52">{tenant?.gstin ? `GSTIN ${tenant.gstin}` : "Local PostgreSQL"}</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {groups.map((group) => {
            const items = group.items.filter((item) => !item.roles || (role && item.roles.includes(role)));
            if (items.length === 0) return null;

            return (
              <div key={group.label}>
                <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/48">{group.label}</div>
                <div className="space-y-1">
                  {items.map((item) => <NavRow key={item.to} item={item} />)}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="m-4 rounded-lg border border-white/10 bg-white/[0.045] p-3">
        <div className="text-[11px] font-semibold text-white/95">Daily close checklist</div>
        <div className="mt-1 text-[11px] leading-4 text-white/60">Review dues, low stock, and cash balance before closing.</div>
      </div>
    </aside>
  );
};

export const MobileTabBar = () => {
  const location = useLocation();
  const tabs = [
    { to: "/admin", label: "Home", icon: LayoutDashboard },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/pos", label: "POS", icon: ScanLine, primary: true },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { to: "/admin/ai", label: "AI", icon: Sparkles },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/92 shadow-elevated backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, primary }) => {
          const active = location.pathname === to;
          return (
            <NavLink key={to} to={to} className="flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold">
              {primary ? (
                <div className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full gradient-accent shadow-glow ring-4 ring-background">
                  <Icon className="h-5 w-5 text-accent-foreground" />
                </div>
              ) : (
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              )}
              <span className={cn(primary ? "text-accent-foreground" : active ? "text-primary" : "text-muted-foreground")}>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
