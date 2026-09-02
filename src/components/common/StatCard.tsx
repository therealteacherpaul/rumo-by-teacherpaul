import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  progress?: number;
  className?: string;
};

export function StatCard({ label, value, hint, icon, progress, className }: Props) {
  return (
    <Card className={cn("border-border/80 shadow-none", className)}>
      <CardContent className="pt-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold leading-none">{value}</p>
          </div>
          {icon && <span className="shrink-0 text-gold">{icon}</span>}
        </div>
        {typeof progress === "number" && <Progress value={progress} className="mt-4 h-1.5" />}
        {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
