import { Bell, Globe, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STORE } from "@/data/mockData";

export const Topbar = () => {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-14">
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products, orders, customers..."
              className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background"
            />
          </div>
        </div>
        <div className="flex-1 md:hidden">
          <div className="font-display font-bold text-base text-primary">{STORE.name}</div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium">EN</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
          </Button>
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full gradient-primary text-white flex items-center justify-center text-xs font-semibold">
              RS
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold leading-tight">{STORE.ownerName}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">Store Owner</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
