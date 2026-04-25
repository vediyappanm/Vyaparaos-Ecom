import { ReactNode } from "react";

export const PageHeader = ({
  title, description, actions, eyebrow,
}: {
  title: string; description?: string; actions?: ReactNode; eyebrow?: string;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
    <div>
      {eyebrow && (
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold mb-1">{eyebrow}</div>
      )}
      <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);
