import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Oculta o texto, exibindo apenas o monograma. */
  compact?: boolean;
  /** Exibe o slogan abaixo do nome. */
  withTagline?: boolean;
};

export function RumoLogo({ className, compact = false, withTagline = false }: Props) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-gold/60 bg-navy font-display text-sm font-semibold tracking-tight text-gold"
      >
        TP
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate font-display text-lg font-semibold leading-none tracking-tight">
            RUMO
          </span>
          {withTagline ? (
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              Seu sistema operacional pessoal.
            </span>
          ) : (
            <span className="mt-1 block truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              by Teacher Paul
            </span>
          )}
        </span>
      )}
    </div>
  );
}
