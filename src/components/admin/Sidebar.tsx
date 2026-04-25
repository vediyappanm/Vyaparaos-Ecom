import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Wallet,
  UserCog, FileText, BarChart3, Sparkles, Settings, Crown,
  ScanLine, Boxes, ChevronRight, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STORE } from "@/data/mockData";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/pos", label: "New Sale (POS)", icon: ScanLine, highlight: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/purchases", label: "Purchases", icon: ShoppingBag },
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
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 z-30">
      {/* Royal gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[hsl(265_60%_14%)] via-[hsl(280_55%_16%)] to-[hsl(265_70%_10%)]" />
      <div className="absolute inset-0 -z-10 opacity-60 bg-[radial-gradient(ellipse_at_top,hsl(43_90%_55%/0.18),transparent_60%),radial-gradient(ellipse_at_bottom,hsl(310_60%_40%/0.25),transparent_60%)]" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-glow">
            <Crown className="w-5 h-5 text-accent-foreground" />
            <div className="absolute -inset-px rounded-xl ring-1 ring-white/40" />
          </div>
          <div>
            <div className="font-display font-bold text-base text-white leading-tight">VyaparOS</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-gold">Royal Commerce OS</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-white/10">
        <div className="px-3 py-2.5 rounded-xl glass-dark">
          <div className="text-[10px] uppercase tracking-wider text-white/60">Active Store</div>
          <div className="font-display font-semibold text-sm text-white truncate">{STORE.name}</div>
          <div className="text-[10px] text-white/50 truncate font-mono">GSTIN {STORE.gstin}</div>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative",
                "hover:bg-white/10 hover:text-white",
                isActive
                  ? "bg-white/15 text-white font-semibold shadow-[inset_0_1px_0_hsl(0_0%_100%/0.15)]"
                  : "text-white/70",
                highlight && !isActive && "ring-1 ring-accent/40 bg-accent/5"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-gradient-to-b from-accent to-accent-glow shadow-glow" />
                )}
                <Icon className={cn("w-[18px] h-[18px]", highlight && "text-accent")} />
                <span className="flex-1">{label}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/10">
        <div className="px-2 py-2 text-[10px] text-white/40 font-mono">
          v1.0 · Royal Edition
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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-white/40 shadow-elevated">
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
                <div className="-mt-6 w-12 h-12 rounded-full gradient-accent flex items-center justify-center shadow-glow ring-2 ring-white/60">
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
