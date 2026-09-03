import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CalendarRange, Gauge, Timer } from "lucide-react";

import { DemoNotice } from "@/components/common/DemoBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDemoQuery } from "@/hooks/use-demo-query";
import { categoryName, planAlerts, weekBlocks, weekCapacity, weekDays } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/plan")({
  head: () => ({
    meta: [
      { title: "Planejamento — RUMO by Teacher Paul" },
      {
        name: "description",
        content:
          "Visão semanal com compromissos fixos, blocos de foco, capacidade estimada e alertas de sobrecarga.",
      },
      { property: "og:title", content: "Planejamento — RUMO by Teacher Paul" },
      {
        property: "og:description",
        content: "Planeje a semana considerando capacidade real, deslocamentos e imprevistos.",
      },
    ],
  }),
  component: PlanPage,
});

const typeStyles: Record<string, string> = {
  fixo: "border-l-2 border-primary bg-secondary",
  foco: "border-l-2 border-gold bg-gold-soft/60",
  pessoal: "border-l-2 border-muted-foreground/40 bg-muted",
};

function PlanPage() {
  const { data: blocks = [] } = useDemoQuery(["plan", "blocks"], () => weekBlocks);
  const { data: capacity = [] } = useDemoQuery(["plan", "capacity"], () => weekCapacity);
  const { data: alerts = [] } = useDemoQuery(["plan", "alerts"], () => planAlerts);

  const committed = capacity.reduce((s, d) => s + d.committedH, 0);
  const total = capacity.reduce((s, d) => s + d.capacityH, 0);
  const committedProgress = total > 0 ? (committed / total) * 100 : 0;
  const committedPct = Math.round(committedProgress);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Semana de 31/08 a 06/09"
        title="Planejamento"
        description="Um plano que cabe na semana real: compromissos fixos primeiro, foco protegido depois, folga para imprevistos sempre."
      />

      <DemoNotice />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Capacidade estimada"
          value={`${total}h`}
          hint="Horas disponíveis na semana"
          icon={<Gauge className="size-4" />}
        />
        <StatCard
          label="Comprometido"
          value={`${committed}h`}
          hint={`${committedPct}% da capacidade`}
          icon={<CalendarRange className="size-4" />}
          progress={committedProgress}
        />
        <StatCard
          label="Blocos de foco"
          value={String(blocks.filter((b) => b.type === "foco").length)}
          hint="Reservados nesta semana"
          icon={<Timer className="size-4" />}
        />
        <StatCard
          label="Alertas"
          value={String(alerts.length)}
          hint="Conflitos e sobrecarga"
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      <SectionCard title="Visão semanal" description="Compromissos fixos, blocos de foco e tempo pessoal.">
        <div className="-mx-2 overflow-x-auto px-2">
          <div className="grid min-w-[840px] grid-cols-7 gap-3">
            {weekDays.map((day, index) => (
              <div key={day} className="min-w-0">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {day}
                </p>
                <div className="space-y-2">
                  {blocks
                    .filter((b) => b.day === index)
                    .map((b) => (
                      <div key={b.id} className={cn("rounded-md p-2.5", typeStyles[b.type])}>
                        <p className="truncate text-xs font-medium">{b.title}</p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {b.start}–{b.end} · {categoryName(b.category)}
                        </p>
                      </div>
                    ))}
                  {blocks.filter((b) => b.day === index).length === 0 && (
                    <div className="rounded-md border border-dashed border-border px-2.5 py-4 text-center text-[11px] text-muted-foreground">
                      Livre
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-3 w-1 rounded bg-primary" aria-hidden /> Compromisso fixo
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-1 rounded bg-gold" aria-hidden /> Bloco de foco
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-1 rounded bg-muted-foreground/40" aria-hidden /> Pessoal
          </span>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Capacidade estimada por dia" description="Comprometido versus disponível.">
          <ul className="space-y-4">
            {capacity.map((d) => {
              const pct = d.capacityH > 0 ? Math.round((d.committedH / d.capacityH) * 100) : 0;
              const over = d.committedH > d.capacityH;
              return (
                <li key={d.day}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{d.day}</span>
                    <span className={cn("tabular-nums", over && "text-destructive")}>
                      {d.committedH}h / {d.capacityH}h
                    </span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="mt-2 h-1.5" />
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Alertas" description="Sinais para ajustar antes que virem atraso.">
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border border-border/70 p-3"
              >
                <AlertTriangle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    a.level === "conflito" ? "text-destructive" : "text-warning",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <Badge variant="outline" className="mb-1 capitalize">
                    {a.level}
                  </Badge>
                  <p className="text-sm">{a.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
