import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const ComingSoon = ({ title, description }: { title: string; description?: string }) => (
  <div className="px-4 lg:px-6 py-5 animate-fade-in">
    <h1 className="font-display font-bold text-2xl lg:text-3xl">{title}</h1>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
    <Card className="mt-6 p-12 text-center bg-gradient-to-br from-muted/40 to-card">
      <div className="w-16 h-16 mx-auto rounded-2xl gradient-accent flex items-center justify-center shadow-glow">
        <Construction className="w-8 h-8 text-accent-foreground" />
      </div>
      <h2 className="mt-4 font-display font-bold text-xl">Coming in next phase</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        This module is part of Phase 2 of VyaparOS. The Phase 1 MVP focuses on Dashboard, Products, POS sales, and GST invoice generation.
      </p>
    </Card>
  </div>
);

export default ComingSoon;
