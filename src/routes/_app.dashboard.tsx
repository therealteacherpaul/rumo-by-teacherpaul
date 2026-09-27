import { pluralize } from "@/lib/pluralize";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DemoNotice } from "@/components/common/DemoBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { useAppDataMode } from "@/hooks/use-app-data-mode";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { useDemoQuery } from "@/hooks/use-demo-query";
import { dashboardData } from "@/lib/demo-data";
import { formatDurationHours } from "@/lib/format-duration";
import { TaskDataProvider } from "@/components/tasks/TaskDataProvider";
import { useTaskData } from "@/hooks/use-task-data";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useHabits } from "@/hooks/use-habits";
import { habitOccursOnDate } from "@/lib/habit-data";
import { loadFocusSessions } from "@/lib/focus-repository";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RUMO by Teacher Paul" },
      {
        name: "description",
        content:
          "Indicadores individuais: tarefas, horas por categoria, foco, sono, treino, estudo, deslocamento e refeições.",
      },
      { property: "og:title", content: "Dashboard — RUMO by Teacher Paul" },
      {
        property: "og:description",
        content: "Indicadores compreensíveis um a um, sem índice único de produtividade.",
      },
    ],
  }),
  component: DashboardPage,
});

const axis = { fontSize: 12, fill: "var(--color-muted-foreground)" };

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
  color: "var(--color-card-foreground)",
};

function DashboardPage() {
  const mode = useAppDataMode();
  const { data } = useDemoQuery(["dashboard"], () => dashboardData);
  const { user } = useAuth();

  if (mode === "authenticated") {
    return user ? (
      <TaskDataProvider key={user.id} userId={user.id}>
        <AuthenticatedDashboard />
      </TaskDataProvider>
    ) : null;
  }

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Últimas 4 semanas"
        title="Dashboard"
        description="Cada indicador é lido sozinho. Não existe uma nota única de produtividade — existe entendimento do seu ritmo."
      />

      <DemoNotice />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Treino"
          value={`${data.training.realizados}/${data.training.planejados}`}
          hint={`${data.training.unidade} realizados na semana`}
          progress={pct(data.training.realizados, data.training.planejados)}
        />
        <StatCard
          label="Estudo"
          value={formatDurationHours(data.study.realizadas)}
          hint={`de ${formatDurationHours(data.study.planejadas)} planejadas`}
          progress={pct(data.study.realizadas, data.study.planejadas)}
        />
        <StatCard
          label="Trabalho estratégico"
          value={formatDurationHours(data.strategicWork.realizadas)}
          hint={`de ${formatDurationHours(data.strategicWork.planejadas)} planejadas`}
          progress={pct(data.strategicWork.realizadas, data.strategicWork.planejadas)}
        />
        <StatCard
          label="Deslocamento"
          value={formatDurationHours(data.commute.realizadas)}
          hint={`${formatDurationHours(data.commute.planejadas)} planejadas — 1h30 acima`}
          progress={100}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Tarefas planejadas versus concluídas"
          description="Por semana, em quantidade de tarefas."
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tasksPlannedVsDone}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="week" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="planejadas" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="concluidas" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-chart-5" aria-hidden /> Planejadas
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-chart-1" aria-hidden /> Concluídas
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Horas por categoria" description="Distribuição do tempo na semana.">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hoursByCategory} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  horizontal={false}
                />
                <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axis}
                  axisLine={false}
                  tickLine={false}
                  width={92}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="horas" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-chart-5" aria-hidden /> Planejado
            </span>
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-chart-2" aria-hidden /> Realizado
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Sessões de foco" description="Quantidade por dia da semana.">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.focusSessionsWeek}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axis}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="sessoes" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Sono planejado versus realizado" description="Horas por noite.">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sleep}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={28} domain={[4, 9]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="planejado"
                  stroke="var(--color-chart-5)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="realizado"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Refeições em casa versus fora de casa"
          description="Contagem de refeições na semana."
          className="lg:col-span-2"
        >
          <div className="grid gap-6 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.meals}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {data.meals.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={i === 0 ? "var(--color-chart-1)" : "var(--color-chart-2)"}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3">
              {data.meals.map((m, i) => (
                <li key={m.name} className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        background: i === 0 ? "var(--color-chart-1)" : "var(--color-chart-2)",
                      }}
                      aria-hidden
                    />
                    <span className="break-words">{m.name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {m.value} {pluralize(m.value, "refeição", "refeições")}
                  </span>
                </li>
              ))}
              <li className="pt-2 text-xs text-muted-foreground">
                Sem meta imposta: o objetivo é enxergar o padrão e decidir se ele combina com a
                semana que você quer ter.
              </li>
            </ul>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AuthenticatedDashboard() {
  const data = useTaskData();
  const { user } = useAuth();
  const habits = useHabits();
  const [focusMinutes, setFocusMinutes] = useState<number | null>(null);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    loadFocusSessions(user.id)
      .then((rows) => {
        if (!alive) return;
        setFocusMinutes(
          rows
            .filter((row) => row.started_at >= since)
            .reduce((total, row) => total + (row.actual_minutes ?? 0), 0),
        );
      })
      .catch(() => alive && setFocusMinutes(-1));
    return () => {
      alive = false;
    };
  }, [user]);

  const today = new Date().toLocaleDateString("en-CA");
  const todayHabits = habits.activeHabits.filter((h) => habitOccursOnDate(h, today));
  const doneToday = todayHabits.filter((h) => {
    const s = habits.getHabitStatus(h, today);
    return s === "feito" || s === "modo_leve";
  }).length;
  const habitPercent = todayHabits.length
    ? Math.round(
        todayHabits.reduce((t, h) => t + habits.getHabitProgress(h, today), 0) /
          todayHabits.length,
      )
    : 0;

  const cards: { label: string; value: string; hint: string; progress?: number }[] = [
    {
      label: "Tarefas concluídas",
      value: String(
        data.tasks.filter((task) => task.status === "Concluída" && !task.archived).length,
      ),
      hint: "no total",
    },
    {
      label: "Projetos ativos",
      value: String(data.projects.filter((project) => project.active).length),
      hint: "em andamento",
    },
    {
      label: "Tempo de foco",
      value:
        focusMinutes === null
          ? "…"
          : focusMinutes < 0
            ? "Indisponível"
            : formatDurationHours(focusMinutes / 60),
      hint: "últimos 7 dias",
    },
    {
      label: "Hábitos hoje",
      value: habits.loading ? "…" : `${doneToday}/${todayHabits.length}`,
      hint: `${habitPercent}% de conclusão média`,
      progress: habitPercent,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        showDemoBadge={false}
        title="Dashboard"
        description="Resumo dos seus dados atuais."
      />
      <SectionCard title="Visão geral" description="Números reais da sua conta.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-border/70 p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{card.value}</p>
              {typeof card.progress === "number" && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/tasks">Ver tarefas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/habits">Ver hábitos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/focus">Ir para o foco</Link>
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
