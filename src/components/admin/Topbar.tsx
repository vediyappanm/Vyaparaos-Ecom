import { Bell, Globe, Search, ChevronDown, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STORE } from "@/data/mockData";

export const Topbar = () => {
  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-white/40">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-14">
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products, orders, customers..."
              className="pl-9 h-9 bg-white/40 dark:bg-white/5 border-white/40 focus-visible:bg-white/70"
            />
          </div>
        </div>
        <div className="flex-1 md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-accent-foreground" />
          </div>
          <div className="font-display font-bold text-sm text-primary truncate">{STORE.name}</div>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-muted-foreground hover:bg-white/40">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium">EN</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="relative hover:bg-white/40">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent ring-2 ring-background" />
          </Button>
          <div className="flex items-center gap-2 pl-2 border-l border-white/30">
            <div className="w-9 h-9 rounded-full gradient-royal text-white flex items-center justify-center text-xs font-bold ring-1 ring-accent/50 shadow-glow">
              RS
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold leading-tight">{STORE.ownerName}</div>
              <div className="text-[10px] text-gold leading-tight font-medium">Store Owner</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
