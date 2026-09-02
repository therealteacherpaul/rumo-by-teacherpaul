import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DEMO_NOTICE } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-gold/50 bg-gold-soft text-gold-foreground", className)}
    >
      Dados de exemplo
    </Badge>
  );
}

export function DemoNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-gold/40 bg-gold-soft/60 px-3 py-2 text-xs text-gold-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{DEMO_NOTICE}</span>
    </p>
  );
}
