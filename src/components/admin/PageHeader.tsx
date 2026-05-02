import { ReactNode } from "react";

export const PageHeader = ({
  title, description, actions, eyebrow,
}: {
  title: string; description?: string; actions?: ReactNode; eyebrow?: string;
}) => (
  <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && (
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</div>
      )}
      <h1 className="truncate font-display text-2xl font-bold text-foreground lg:text-[1.7rem]">{title}</h1>
      {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </div>
);
