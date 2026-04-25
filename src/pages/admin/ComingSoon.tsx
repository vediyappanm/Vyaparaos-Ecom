import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";

export const ComingSoon = ({ title, description }: { title: string; description?: string }) => (
  <div className="px-4 lg:px-6 py-5 animate-fade-in">
    <PageHeader title={title} description={description} eyebrow="Module" />
    <Card className="mt-6 p-12 text-center royal-orb-bg">
      <div className="relative">
        <div className="w-16 h-16 mx-auto rounded-2xl gradient-accent flex items-center justify-center shadow-glow ring-1 ring-white/40">
          <Sparkles className="w-8 h-8 text-accent-foreground" />
        </div>
        <h2 className="mt-4 font-display font-bold text-xl">Crafting royal experience…</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          This module ships in a future phase. The current preview gives you working Dashboard, POS, Products, Orders, Inventory, Purchases, Parties, Finance, Staff, Invoices, Reports, AI &amp; Settings.
        </p>
      </div>
    </Card>
  </div>
);

export default ComingSoon;
