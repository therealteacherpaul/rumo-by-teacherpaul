import type { ReactNode } from "react";

import { DemoBadge } from "@/components/common/DemoBadge";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  showDemoBadge?: boolean;
};

export function PageHeader({ eyebrow, title, description, actions, showDemoBadge = true }: Props) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold text-balance-tight sm:text-3xl">{title}</h1>
        <div className="gold-rule mt-3" aria-hidden />
        {description && (
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {showDemoBadge && <DemoBadge />}
        {actions}
      </div>
    </header>
  );
}
