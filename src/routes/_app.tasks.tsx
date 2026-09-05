import { createFileRoute } from "@tanstack/react-router";
import { Check, ListFilter, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DemoNotice } from "@/components/common/DemoBadge";
import { useCategories } from "@/hooks/use-categories";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoQuery } from "@/hooks/use-demo-query";
import { tasks as demoTasks } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({
    meta: [
      { title: "Tarefas — RUMO by Teacher Paul" },
      {
        name: "description",
        content:
          "Tarefas e projetos com categoria, prioridade, prazo, duração estimada e status em uma lista clara.",
      },
      { property: "og:title", content: "Tarefas — RUMO by Teacher Paul" },
      {
        property: "og:description",
        content: "Organize projetos e tarefas com estimativas realistas de duração.",
      },
    ],
  }),
  component: TasksPage,
});

const priorityStyle: Record<string, string> = {
  Alta: "border-destructive/40 text-destructive",
  Média: "border-warning/50 text-warning",
  Baixa: "border-border text-muted-foreground",
};

const statusStyle: Record<string, string> = {
  "A fazer": "bg-secondary text-secondary-foreground",
  "Em andamento": "bg-gold-soft text-gold-foreground",
  Aguardando: "bg-muted text-muted-foreground",
  Concluída: "bg-success/15 text-success",
};

function TasksPage() {
  const { categories, categoryName } = useCategories();
  const { data: tasks = [] } = useDemoQuery(["tasks"], () => demoTasks);
  const [localTasks, setLocalTasks] = useState(() => tasks.map((task) => ({ ...task })));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [taskMessage, setTaskMessage] = useState("");

  const filtered = useMemo(
    () =>
      localTasks.filter(
        (t) =>
          (category === "todas" || t.category === category) &&
          (status === "todos" || t.status === status) &&
          (t.title.toLowerCase().includes(query.toLowerCase()) ||
            t.project.toLowerCase().includes(query.toLowerCase())),
      ),
    [localTasks, query, category, status],
  );

  const projects = Array.from(new Set(localTasks.map((t) => t.project)));

  const toggleTask = (taskId: string) => {
    const task = localTasks.find((item) => item.id === taskId);
    if (!task) return;

    const completed = task.status === "Concluída";
    setLocalTasks((current) =>
      current.map((item) =>
        item.id === taskId ? { ...item, status: completed ? "A fazer" : "Concluída" } : item,
      ),
    );
    setTaskMessage(
      completed ? "Tarefa reaberta nesta demonstração." : "Tarefa concluída nesta demonstração.",
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${projects.length} projetos ativos`}
        title="Tarefas"
        description="Cada tarefa tem duração estimada, porque planejar sem tempo é apenas uma lista de desejos."
      />

      <DemoNotice />

      <SectionCard
        title="Lista de tarefas"
        description="Filtre por categoria e status para enxergar apenas o que importa agora."
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tarefa ou projeto"
              className="pl-9"
              aria-label="Buscar tarefa"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {["A fazer", "Em andamento", "Aguardando", "Concluída"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<ListFilter className="size-5" />}
            title="Nenhuma tarefa encontrada"
            description="Ajuste os filtros ou limpe a busca para ver as tarefas de exemplo."
          />
        ) : (
          <>
            {/* Tabela — telas médias e maiores */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="max-w-xs">
                        <button
                          type="button"
                          className="mr-2 inline-flex size-5 items-center justify-center rounded-sm border border-input align-middle outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`${t.status === "Concluída" ? "Reabrir" : "Concluir"} tarefa: ${t.title}`}
                          aria-pressed={t.status === "Concluída"}
                          onClick={() => toggleTask(t.id)}
                        >
                          {t.status === "Concluída" && <Check className="size-3" aria-hidden />}
                        </button>
                        <p className="break-words font-medium">{t.title}</p>
                        <p className="break-words text-xs text-muted-foreground">{t.project}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {categoryName(t.category)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityStyle[t.priority]}>
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {new Date(t.due).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {t.estimateMin} min
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                            statusStyle[t.status],
                          )}
                        >
                          {t.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Cartões — celular */}
            <ul className="space-y-3 md:hidden">
              {filtered.map((t) => (
                <li key={t.id} className="rounded-lg border border-border/70 p-3">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                    <button
                      type="button"
                      className="mt-0.5 inline-flex size-5 items-center justify-center rounded-sm border border-input outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`${t.status === "Concluída" ? "Reabrir" : "Concluir"} tarefa: ${t.title}`}
                      aria-pressed={t.status === "Concluída"}
                      onClick={() => toggleTask(t.id)}
                    >
                      {t.status === "Concluída" && <Check className="size-3" aria-hidden />}
                    </button>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">{t.title}</p>
                      <p className="break-words text-xs text-muted-foreground">{t.project}</p>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0", priorityStyle[t.priority])}>
                      {t.priority}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{categoryName(t.category)}</span>
                    <span aria-hidden>·</span>
                    <span>{new Date(t.due).toLocaleDateString("pt-BR")}</span>
                    <span aria-hidden>·</span>
                    <span>{t.estimateMin} min</span>
                    <span
                      className={cn(
                        "ml-auto rounded-full px-2 py-0.5 font-medium",
                        statusStyle[t.status],
                      )}
                    >
                      {t.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        {taskMessage && (
          <p className="mt-3 text-xs text-success" role="status">
            {taskMessage}
          </p>
        )}
      </SectionCard>

      <SectionCard title="Projetos" description="Agrupamento das tarefas de exemplo.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const items = localTasks.filter((t) => t.project === p);
            const doneCount = items.filter((t) => t.status === "Concluída").length;
            return (
              <li key={p} className="rounded-lg border border-border/70 p-4">
                <p className="break-words text-sm font-medium">{p}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {doneCount} de {items.length} tarefas concluídas
                </p>
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}
