import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, CircleAlert, ListTodo, Sprout, Trophy } from "lucide-react";
import { useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { DemoNotice } from "@/components/common/DemoBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { TaskDataProvider } from "@/components/tasks/TaskDataProvider";
import { useAppDataMode } from "@/hooks/use-app-data-mode";
import { useAuth } from "@/hooks/use-auth";
import { useHabits } from "@/hooks/use-habits";
import { TaskDataContext } from "@/components/tasks/task-data-context";
import { reviewSummary } from "@/lib/plan-review";
import { tasks as demoTasks } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/review")({
  head: () => ({ meta: [{ title: "Revisão semanal — RUMO by Teacher Paul" }] }),
  component: ReviewPage,
});
const demoDate = "2026-09-20";

function ReviewPage() {
  const mode = useAppDataMode();
  const { user } = useAuth();
  if (mode === "authenticated" && user)
    return (
      <TaskDataProvider key={user.id} userId={user.id}>
        <ReviewContent />
      </TaskDataProvider>
    );
  return <ReviewContent />;
}

function ReviewContent() {
  const mode = useAppDataMode();
  const data = useContext(TaskDataContext);
  const habits = useHabits();
  const demoProjects = useMemo(
    () =>
      [...new Set(demoTasks.map((task) => task.project))].map((name) => ({
        id: name,
        name,
        active: true,
        category_id: null,
        created_at: "2026-09-01",
        updated_at: "2026-09-20",
        user_id: "demo",
      })),
    [],
  );
  const tasks =
    data?.tasks ??
    demoTasks.map((task) => ({
      id: task.id,
      title: task.title,
      project_id: task.project,
      priority: task.priority,
      due_date: task.due,
      estimate_min: task.estimateMin,
      status: task.status,
      archived: false,
      updated_at: "2026-09-20",
      category_id: task.category,
      created_at: "2026-09-01",
      user_id: "demo",
    }));
  const summary = reviewSummary(
    tasks,
    data?.projects ?? demoProjects,
    habits.habits,
    habits.checkIns,
    mode === "demo" ? demoDate : new Date().toISOString().slice(0, 10),
  );
  const search = mode === "demo" ? { mode: "demo" as const } : {};
  return (
    <div className="space-y-8">
      <PageHeader
        showDemoBadge={false}
        eyebrow={`${summary.start.split("-").reverse().join("/")} a ${summary.end.split("-").reverse().join("/")}`}
        title="Revisão semanal"
        description="Compare o que ficou pendente, reconheça o que avançou e escolha o próximo passo."
      />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Concluídas" value={String(summary.completed.length)} />
        <Metric label="Abertas" value={String(summary.open.length)} />
        <Metric label="Atrasadas" value={String(summary.overdue.length)} />
        <Metric label="Hábitos" value={`${summary.habits.percent}%`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard
          title="Tarefas concluídas"
          icon={<Trophy className="size-4 text-success" />}
          items={summary.completed.map((task) => task.title)}
          empty="Nenhuma tarefa concluída neste período."
        />
        <ListCard
          title="Tarefas abertas e atrasadas"
          icon={<CircleAlert className="size-4 text-destructive" />}
          items={summary.overdue.map((task) => task.title)}
          empty="Nenhuma tarefa atrasada."
        />
        <ListCard
          title="Tarefas sem prazo"
          icon={<ListTodo className="size-4 text-warning" />}
          items={summary.noDue.map((task) => task.title)}
          empty="Todas as tarefas abertas têm prazo."
        />
        <SectionCard title="Hábitos concluídos" description="Registros persistidos no período.">
          <p className="text-3xl font-semibold tabular-nums">
            {summary.habits.completed}{" "}
            <span className="text-base font-normal text-muted-foreground">
              de {summary.habits.expected}
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.habits.expected
              ? "Taxa calculada sobre hábitos ativos e sete dias."
              : "Nenhum hábito ativo para avaliar."}
          </p>
        </SectionCard>
        <SectionCard
          title="Projetos ativos"
          description="Projetos persistidos disponíveis nesta conta."
        >
          <p className="text-3xl font-semibold tabular-nums">{summary.activeProjects.length}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {summary.activeProjects.slice(0, 6).map((project) => (
              <li key={project.id} className="break-words">
                {project.name}
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard
          title="Histórico de foco"
          description="O Focus ainda não persiste histórico neste MVP."
        >
          <p className="text-sm text-muted-foreground">
            Sem histórico persistido para este período.
          </p>
        </SectionCard>
      </div>
      <SectionCard
        title="Alertas e próximos passos"
        description="Recomendações determinísticas para a próxima semana."
      >
        <ul className="space-y-2 text-sm">
          {summary.alerts.length ? (
            summary.alerts.map((alert) => (
              <li key={alert} className="flex gap-2">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                {alert}
              </li>
            ))
          ) : (
            <li className="flex gap-2">
              <Sprout className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              Sua semana está sem alertas prioritários.
            </li>
          )}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/tasks" search={search}>
              Criar tarefa
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/tasks" search={search}>
              Revisar tarefas atrasadas
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/habits" search={search}>
              Abrir hábitos
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard" search={search}>
              Abrir Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/today" search={search}>
              <ArrowRight className="mr-2 size-4" />
              Voltar para Today
            </Link>
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
function ListCard({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  empty: string;
}) {
  return (
    <SectionCard title={title} action={icon}>
      <ul className="space-y-2 text-sm">
        {items.length ? (
          items.map((item) => (
            <li key={item} className="break-words">
              {item}
            </li>
          ))
        ) : (
          <li className="text-muted-foreground">{empty}</li>
        )}
      </ul>
    </SectionCard>
  );
}
