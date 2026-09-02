import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useState } from "react";

import { DemoNotice } from "@/components/common/DemoBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoQuery } from "@/hooks/use-demo-query";
import { categoryName, focusSessions, tasks } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/focus")({
  head: () => ({
    meta: [
      { title: "Foco — RUMO by Teacher Paul" },
      {
        name: "description",
        content:
          "Temporizador de foco com tarefa selecionada, duração planejada e histórico das últimas sessões.",
      },
      { property: "og:title", content: "Foco — RUMO by Teacher Paul" },
      {
        property: "og:description",
        content: "Blocos de foco protegidos, com duração planejada e histórico honesto.",
      },
    ],
  }),
  component: FocusPage,
});

const durations = [25, 50, 90];

function FocusPage() {
  const { data: sessions = [] } = useDemoQuery(["focus", "sessions"], () => focusSessions);
  const [taskId, setTaskId] = useState(tasks[0]!.id);
  const [duration, setDuration] = useState(50);

  const selected = tasks.find((t) => t.id === taskId);
  const minutes = String(duration).padStart(2, "0");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Uma coisa por vez"
        title="Foco"
        description="O temporizador é apenas visual nesta etapa. A ideia é escolher uma tarefa, definir a duração e proteger o bloco."
      />

      <DemoNotice />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Sessão atual" description="Escolha a tarefa e a duração planejada.">
          <div className="flex flex-col items-center rounded-xl border border-border/70 bg-secondary/60 px-6 py-10">
            <p className="font-display text-6xl font-semibold tabular-nums tracking-tight">
              {minutes}:00
            </p>
            <p className="mt-3 max-w-xs truncate text-center text-sm text-muted-foreground">
              {selected ? selected.title : "Nenhuma tarefa selecionada"}
            </p>
            <Progress value={0} className="mt-6 h-1.5 w-full max-w-xs" />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button disabled className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Play className="size-4" aria-hidden />
                Iniciar
              </Button>
              <Button variant="outline" disabled>
                <Pause className="size-4" aria-hidden />
                Pausar
              </Button>
              <Button variant="ghost" disabled>
                <RotateCcw className="size-4" aria-hidden />
                Reiniciar
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Controles desabilitados nesta versão de demonstração.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tarefa
              </p>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger aria-label="Selecionar tarefa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Duração planejada
              </p>
              <div className="flex gap-2">
                {durations.map((d) => (
                  <Button
                    key={d}
                    variant={duration === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration(d)}
                    className="flex-1"
                  >
                    {d} min
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Histórico de sessões" description="Últimas sessões registradas.">
          {sessions.length === 0 ? (
            <EmptyState
              icon={<Timer className="size-5" />}
              title="Ainda sem sessões"
              description="Quando você concluir um bloco de foco, ele aparece aqui."
            />
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.task}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {s.date} · {categoryName(s.category)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm tabular-nums">
                    {s.realMin}
                    <span className="text-muted-foreground"> / {s.plannedMin} min</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Sessões mais curtas do que o planejado não são falha: são informação para planejar
            melhor a próxima semana.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
