import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FolderKanban, ListTodo } from "lucide-react";
import { useContext, useMemo } from "react";

import { DemoNotice } from "@/components/common/DemoBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TaskDataProvider } from "@/components/tasks/TaskDataProvider";
import { useAppDataMode } from "@/hooks/use-app-data-mode";
import { useAuth } from "@/hooks/use-auth";
import { TaskDataContext } from "@/components/tasks/task-data-context";
import { tasks as demoTasks } from "@/lib/demo-data";
import { projectProgress, taskBucket } from "@/lib/plan-review";

export const Route = createFileRoute("/_app/plan")({
  head: () => ({ meta: [{ title: "Planejamento — RUMO by Teacher Paul" }] }),
  component: PlanPage,
});

const formatDate = (date: string | null) =>
  date ? date.split("-").reverse().join("/") : "Sem prazo";
const today = () => new Date().toISOString().slice(0, 10);

function PlanPage() {
  const mode = useAppDataMode();
  const { user } = useAuth();
  if (mode === "authenticated" && user)
    return (
      <TaskDataProvider key={user.id} userId={user.id}>
        <PlanContent />
      </TaskDataProvider>
    );
  return <PlanContent />;
}

function PlanContent() {
  const mode = useAppDataMode();
  const data = useContext(TaskDataContext);
  const demoProjects = useMemo(
    () =>
      [...new Set(demoTasks.map((task) => task.project))].map((name) => ({
        id: name,
        name,
        active: true,
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
  const projects = data?.projects ?? demoProjects;
  const activeTasks = tasks.filter((task) => !task.archived);
  const groups = projects
    .map((project) => ({
      project,
      tasks: activeTasks.filter((task) => task.project_id === project.id),
    }))
    .filter((group) => group.tasks.length);
  const unassigned = activeTasks.filter((task) => !task.project_id);
  const buckets = {
    atrasadas: activeTasks.filter((task) => taskBucket(task, today()) === "atrasadas"),
    proximas: activeTasks.filter((task) => taskBucket(task, today()) === "proximas"),
    semPrazo: activeTasks.filter((task) => taskBucket(task, today()) === "semPrazo"),
  };
  const search = mode === "demo" ? { mode: "demo" as const } : {};
  const toggle = data?.setTaskStatus;
  if (!activeTasks.length)
    return (
      <div className="space-y-6">
        <PageHeader
          showDemoBadge={false}
          eyebrow="Organização real"
          title="Planejamento"
          description="Uma visão prática das suas tarefas e projetos."
        />
        <DemoNotice />
        <EmptyState
          icon={<ListTodo className="size-5" />}
          title="Nenhuma tarefa para planejar"
          description="Crie sua primeira tarefa ou projeto para começar a organizar o trabalho."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/tasks" search={search}>
                  Criar tarefa
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/tasks" search={search}>
                  Criar projeto
                </Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  return (
    <div className="space-y-8">
      <PageHeader
        showDemoBadge={false}
        eyebrow="Visão prática"
        title="Planejamento"
        description="Agrupe tarefas por projeto e veja o que merece atenção primeiro."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/today" search={search}>
                Abrir Planejador do dia
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/tasks" search={search}>
                Criar tarefa ou projeto
              </Link>
            </Button>
          </div>
        }
      />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary
          label="Tarefas abertas"
          value={String(activeTasks.filter((task) => task.status !== "Concluída").length)}
        />
        <Summary label="Atrasadas" value={String(buckets.atrasadas.length)} />
        <Summary label="Sem prazo" value={String(buckets.semPrazo.length)} />
      </div>
      <SectionCard
        title="Prioridade de atenção"
        description="Comece pelo que está atrasado, depois avance para os próximos prazos."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {(
            [
              ["atrasadas", "Atrasadas", buckets.atrasadas],
              ["proximas", "Próximas", buckets.proximas],
              ["semPrazo", "Sem prazo", buckets.semPrazo],
            ] as const
          ).map(([key, label, items]) => (
            <div key={key} className="rounded-lg border border-border/70 p-4">
              <h2 className="font-medium">
                {label} <Badge variant="outline">{items.length}</Badge>
              </h2>
              <ul className="mt-3 space-y-2">
                {items.slice(0, 5).map((task) => (
                  <TaskRow key={task.id} task={task} mode={mode} onToggle={toggle} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Por projeto" description="O progresso considera tarefas não arquivadas.">
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(({ project, tasks: projectTasks }) => {
            const progress = projectProgress(tasks, project.id);
            return (
              <div key={project.id} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FolderKanban className="size-4 shrink-0 text-gold" aria-hidden />
                    <h2 className="break-words font-medium">{project.name}</h2>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">{progress.percent}%</span>
                </div>
                <Progress value={progress.percent} className="mt-3 h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {progress.done} de {progress.total} concluídas
                </p>
                <ul className="mt-3 space-y-2">
                  {projectTasks.map((task) => (
                    <TaskRow key={task.id} task={task} mode={mode} onToggle={toggle} />
                  ))}
                </ul>
              </div>
            );
          })}
          {unassigned.length > 0 && (
            <div className="rounded-lg border border-dashed p-4">
              <h2 className="font-medium">Sem projeto</h2>
              <ul className="mt-3 space-y-2">
                {unassigned.map((task) => (
                  <TaskRow key={task.id} task={task} mode={mode} onToggle={toggle} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
function TaskRow({
  task,
  mode,
  onToggle,
}: {
  task: {
    id: string;
    title: string;
    priority: string;
    due_date: string | null;
    estimate_min: number;
    status: string;
  };
  mode: "demo" | "authenticated";
  onToggle?: ((id: string, done: boolean) => Promise<unknown>) | undefined;
}) {
  const search = mode === "demo" ? { mode: "demo" as const } : {};
  return (
    <li className="rounded-md border border-border/60 p-3">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <Link
          to="/tasks"
          search={search}
          className={`min-w-0 break-words text-sm font-medium underline-offset-4 hover:underline ${task.status === "Concluída" ? "line-through text-muted-foreground" : ""}`}
        >
          {task.title}
        </Link>
        {onToggle ? (
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 shrink-0"
            onClick={() => void onToggle(task.id, task.status !== "Concluída")}
          >
            {task.status === "Concluída" ? "Reabrir" : "Concluir"}
          </Button>
        ) : task.status === "Concluída" ? (
          <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Concluída" />
        ) : null}
      </div>
      <p className="mt-1 break-words text-xs text-muted-foreground">
        {task.priority} · {formatDate(task.due_date)} ·{" "}
        {task.estimate_min > 0 ? `${task.estimate_min} min` : "Sem estimativa"} · {task.status}
      </p>
    </li>
  );
}
