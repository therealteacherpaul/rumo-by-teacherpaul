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
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { useDemoQuery } from "@/hooks/use-demo-query";
import { dashboardData } from "@/lib/demo-data";
import { formatDurationHours } from "@/lib/format-duration";

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
  const { data } = useDemoQuery(["dashboard"], () => dashboardData);

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
                  <span className="shrink-0 tabular-nums">{m.value} refeições</span>
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
