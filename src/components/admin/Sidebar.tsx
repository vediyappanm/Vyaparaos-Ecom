import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Wallet,
  UserCog, FileText, BarChart3, Sparkles, Settings, Store,
  ScanLine, Boxes, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STORE } from "@/data/mockData";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/pos", label: "New Sale (POS)", icon: ScanLine, highlight: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/parties", label: "Parties", icon: Users },
  { to: "/admin/finance", label: "Finance", icon: Wallet },
  { to: "/admin/staff", label: "Staff", icon: UserCog },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/ai", label: "AI Assistant", icon: Sparkles },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export const Sidebar = () => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground h-screen sticky top-0 border-r border-sidebar-border">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center shadow-glow">
            <Store className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-white leading-tight">VyaparOS</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Commerce OS</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="px-2 py-2 rounded-lg bg-sidebar-accent/40">
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Active Store</div>
          <div className="font-display font-semibold text-sm text-white truncate">{STORE.name}</div>
          <div className="text-[10px] text-sidebar-foreground/60 truncate">GSTIN {STORE.gstin}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end, highlight }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group",
                "hover:bg-sidebar-accent hover:text-white",
                isActive
                  ? "bg-sidebar-accent text-white font-semibold shadow-elegant"
                  : "text-sidebar-foreground/85",
                highlight && !isActive && "ring-1 ring-accent/40"
              )
            }
          >
            <Icon className={cn("w-[18px] h-[18px]", highlight && "text-accent")} />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="px-2 py-2 text-[10px] text-sidebar-foreground/50">
          v1.0 · Phase 1 MVP
        </div>
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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-elevated">
      <div className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, primary }) => {
          const active = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px]",
                primary && "relative"
              )}
            >
              {primary ? (
                <div className="-mt-6 w-12 h-12 rounded-full gradient-accent flex items-center justify-center shadow-glow">
                  <Icon className="w-5 h-5 text-accent-foreground" />
                </div>
              ) : (
                <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
              )}
              <span className={cn(primary ? "text-accent font-semibold" : active ? "text-primary font-semibold" : "text-muted-foreground")}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
