import { Info } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppDataMode } from "@/hooks/use-app-data-mode";
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
  const mode = useAppDataMode();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (mode !== "demo") return null;

  const demoPaths = new Set([
    "/today",
    "/plan",
    "/tasks",
    "/focus",
    "/review",
    "/dashboard",
    "/settings",
    "/habits",
  ]);
  const target = demoPaths.has(pathname) ? pathname : "/today";

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/40 bg-gold-soft/60 px-3 py-2 text-xs text-gold-foreground",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Info className="size-3.5 shrink-0" aria-hidden />
        <span>Modo demonstração — você está vendo dados de exemplo.</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 px-2 text-xs text-gold-foreground hover:bg-gold-soft hover:text-gold-foreground"
        onClick={() => void navigate({ to: target, search: {} })}
      >
        Voltar aos meus dados
      </Button>
    </div>
  );
}
