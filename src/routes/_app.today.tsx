import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Battery, CalendarClock, CheckCircle2, Circle, Target, Timer } from "lucide-react";
import { useState } from "react";

import { DemoNotice } from "@/components/common/DemoBadge";
import { useCategories } from "@/hooks/use-categories";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useDemoQuery } from "@/hooks/use-demo-query";
import { DEMO_TIME_ZONE, formatDateLabel } from "@/lib/date-time";
import { formatDurationHours } from "@/lib/format-duration";
import {
  categoryName,
  energyCheckin,
  plannedVsDoneToday,
  todayAppointments,
  todayPriorities,
} from "@/lib/demo-data";

export const Route = createFileRoute("/_app/today")({
  loader: () => ({
    dateLabel: formatDateLabel(new Date(), DEMO_TIME_ZONE),
  }),
  head: () => ({
    meta: [
      { title: "Hoje — RUMO by Teacher Paul" },
      {
        name: "description",
        content:
          "Prioridades do dia, compromissos, bloco de foco e check-in de energia em uma única tela.",
      },
      { property: "og:title", content: "Hoje — RUMO by Teacher Paul" },
      {
        property: "og:description",
        content: "Comece o dia com direção: três prioridades, agenda real e foco protegido.",
      },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { categoryName } = useCategories();
  const { dateLabel } = Route.useLoaderData();
  const { data: appointments = [] } = useDemoQuery(
    ["today", "appointments"],
    () => todayAppointments,
  );
  const { data: priorities = [] } = useDemoQuery(["today", "priorities"], () => todayPriorities);
  const [energy, setEnergy] = useState(energyCheckin.level);
  const [completedPriorityIds, setCompletedPriorityIds] = useState(
    () => new Set(priorities.filter((priority) => priority.done).map((priority) => priority.id)),
  );
  const [priorityMessage, setPriorityMessage] = useState("");
  const [energyMessage, setEnergyMessage] = useState("");

  const done = completedPriorityIds.size;
  const ratio =
    plannedVsDoneToday.planejado > 0
      ? Math.round((plannedVsDoneToday.realizado / plannedVsDoneToday.planejado) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Bom dia, Paul"
        title="Hoje"
        description={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
      />

      <DemoNotice />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Prioridades"
          value={`${done}/${priorities.length}`}
          hint="Concluídas hoje"
          icon={<Target className="size-4" />}
          progress={(done / Math.max(priorities.length, 1)) * 100}
        />
        <StatCard
          label="Compromissos"
          value={String(appointments.length)}
          hint="Blocos fixos na agenda"
          icon={<CalendarClock className="size-4" />}
        />
        <StatCard
          label="Foco planejado"
          value="1h40"
          hint="2 blocos reservados"
          icon={<Timer className="size-4" />}
        />
        <StatCard
          label="Planejado x realizado"
          value={`${formatDurationHours(plannedVsDoneToday.realizado)} / ${formatDurationHours(plannedVsDoneToday.planejado)}`}
          hint={`${ratio}% do plano executado até agora`}
          icon={<CheckCircle2 className="size-4" />}
          progress={ratio}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionCard
            title="Três prioridades do dia"
            description="Se só isso acontecer, o dia já valeu."
          >
            {priorities.length === 0 ? (
              <EmptyState
                icon={<Target className="size-5" />}
                title="Nenhuma prioridade definida"
                description="Escolha até três resultados que fariam diferença hoje."
              />
            ) : (
              <ul className="space-y-3">
                {priorities.map((p) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/70 px-3 py-3"
                  >
                    <button
                      type="button"
                      className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`${completedPriorityIds.has(p.id) ? "Reabrir" : "Concluir"} prioridade: ${p.title}`}
                      aria-pressed={completedPriorityIds.has(p.id)}
                      onClick={() => {
                        const isCompleted = completedPriorityIds.has(p.id);
                        setCompletedPriorityIds((current) => {
                          const next = new Set(current);
                          if (isCompleted) next.delete(p.id);
                          else next.add(p.id);
                          return next;
                        });
                        setPriorityMessage(
                          isCompleted
                            ? "Prioridade reaberta nesta demonstração."
                            : "Prioridade concluída nesta demonstração.",
                        );
                      }}
                    >
                      {completedPriorityIds.has(p.id) ? (
                        <CheckCircle2 className="size-4 text-success" aria-hidden />
                      ) : (
                        <Circle className="size-4 text-muted-foreground" aria-hidden />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p
                        className={
                          completedPriorityIds.has(p.id)
                            ? "break-words text-sm line-through opacity-70"
                            : "break-words text-sm"
                        }
                      >
                        {p.title}
                      </p>
                      <p className="mt-0.5 break-words text-xs text-muted-foreground">
                        {categoryName(p.category)} · {p.estimateMin} min
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {completedPriorityIds.has(p.id) ? "Feito" : "Aberto"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {priorityMessage && (
              <p className="mt-3 text-xs text-success" role="status">
                {priorityMessage}
              </p>
            )}
          </SectionCard>

          <SectionCard title="Próximos compromissos" description="Blocos fixos que já estão de pé.">
            <ul className="divide-y divide-border">
              {appointments.map((a) => (
                <li
                  key={a.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span className="shrink-0 font-display text-sm tabular-nums text-muted-foreground">
                    {a.start}
                    <span className="block text-xs">{a.end}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">{a.title}</p>
                    <p className="mt-0.5 break-words text-xs text-muted-foreground">
                      {categoryName(a.category)}
                      {a.place ? ` · ${a.place}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Bloco de foco" description="Próxima sessão protegida.">
            <div className="rounded-xl border border-gold/40 bg-gold-soft/50 p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold-foreground">
                11h30 — 12h20
              </p>
              <p className="mt-2 font-display text-lg font-semibold">
                Fechar arquitetura do onboarding
              </p>
              <p className="mt-1 text-xs text-muted-foreground">RUMO · 50 minutos planejados</p>
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/focus">Abrir tela de foco</Link>
            </Button>
          </SectionCard>

          <SectionCard title="Check-in de energia" description="Uma pergunta, sem julgamento.">
            <div className="flex items-center gap-2">
              <Battery className="size-4 shrink-0 text-gold" aria-hidden />
              <p className="min-w-0 break-words text-sm">{energyCheckin.labels[energy - 1]}</p>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {energyCheckin.labels.map((label, i) => (
                <Button
                  key={label}
                  variant={energy === i + 1 ? "default" : "outline"}
                  size="sm"
                  aria-label={label}
                  onClick={() => {
                    setEnergy(i + 1);
                    setEnergyMessage("Check-in atualizado nesta demonstração.");
                  }}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            {energyMessage && (
              <p className="mt-3 text-xs text-success" role="status">
                {energyMessage}
              </p>
            )}
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Energia estável sugere manter os dois blocos de foco e evitar novas demandas hoje.
            </p>
          </SectionCard>

          <SectionCard title="Planejado versus realizado" description="Do dia até agora.">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Planejado</span>
                <span className="font-medium tabular-nums">
                  {formatDurationHours(plannedVsDoneToday.planejado)}
                </span>
              </div>
              <Progress value={100} className="h-1.5" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Realizado</span>
                <span className="font-medium tabular-nums">
                  {formatDurationHours(plannedVsDoneToday.realizado)}
                </span>
              </div>
              <Progress value={ratio} className="h-1.5" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
