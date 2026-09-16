import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTaskData } from "@/hooks/use-task-data";
import type { TaskDraft, TaskPriority, TaskStatus, UserTask } from "@/lib/task-data";
import { CategoryCreator } from "./CategoryCreator";
import { ProjectManager } from "./ProjectManager";
import { DataSelect } from "./DataSelect";

export function AuthenticatedTasks() {
  const data = useTaskData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("");
  const [projectDialog, setProjectDialog] = useState(false);
  const [editor, setEditor] = useState<UserTask | "new" | null>(null);
  const [message, setMessage] = useState("");
  const tasks = data.tasks.filter((task) => !task.archived);
  const projectName = (id: string | null) =>
    data.projects.find((item) => item.id === id)?.name ?? "Sem projeto";
  const filtered = tasks.filter(
    (task) =>
      (!category || task.category_id === category) &&
      (!project || task.project_id === project) &&
      (!status || task.status === status) &&
      `${task.title} ${projectName(task.project_id)}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <div className="space-y-8">
      <PageHeader
        showDemoBadge={false}
        title="Tarefas"
        description="Organize o que precisa fazer e acompanhe seus projetos."
        actions={
          <>
            <Button disabled={data.pending} onClick={() => setEditor("new")}>
              Nova tarefa
            </Button>
            <Button
              variant="outline"
              disabled={data.pending}
              onClick={() => setProjectDialog(true)}
            >
              Novo projeto
            </Button>
          </>
        }
      />
      <SectionCard
        title="Suas tarefas"
        description="Busque por tarefa ou projeto e filtre sua lista."
      >
        <div className="my-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm">
            Buscar tarefa ou projeto
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar"
            />
          </label>
          <DataSelect
            label="Filtrar por categoria"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Todas as categorias</option>
            {data.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </DataSelect>
          <DataSelect
            label="Filtrar por projeto"
            value={project}
            onChange={(event) => setProject(event.target.value)}
          >
            <option value="">Todos os projetos</option>
            {data.projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {!item.active && " (arquivado)"}
              </option>
            ))}
          </DataSelect>
          <DataSelect
            label="Filtrar por status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos os status</option>
            {["A fazer", "Em andamento", "Aguardando", "Concluída"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </DataSelect>
        </div>
        {!tasks.length ? (
          <div className="rounded-lg border border-dashed p-6">
            <h2 className="font-medium">Nenhuma tarefa ainda</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Comece com uma ação pequena. Escolha uma categoria e crie sua primeira tarefa.
            </p>
            <Button className="mt-4" disabled={data.pending} onClick={() => setEditor("new")}>
              Criar primeira tarefa
            </Button>
          </div>
        ) : !filtered.length ? (
          <div>
            <p>Nenhuma tarefa encontrada.</p>
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setCategory("");
                setProject("");
                setStatus("");
              }}
            >
              Limpar busca e filtros
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`break-words font-medium ${task.status === "Concluída" ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </p>
                  <p className="mt-1 break-words text-sm text-muted-foreground">
                    {data.categories.find((item) => item.id === task.category_id)?.name ??
                      "Sem categoria"}{" "}
                    · {projectName(task.project_id)} · {task.priority} ·{" "}
                    {task.due_date
                      ? `Prazo: ${task.due_date.split("-").reverse().join("/")}`
                      : "Sem prazo"}
                  </p>
                  <p className="mt-1 text-xs">
                    {task.status} ·{" "}
                    {task.estimate_min > 0
                      ? `${task.estimate_min} min estimados`
                      : "Sem estimativa"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={data.pending}
                    aria-label={`${task.status === "Concluída" ? "Reabrir" : "Concluir"} tarefa: ${task.title}`}
                    onClick={async () => {
                      const result = await data.setTaskStatus(task.id, task.status !== "Concluída");
                      setMessage(result.valid ? "Tarefa atualizada." : result.reason);
                    }}
                  >
                    {task.status === "Concluída" ? "Reabrir" : "Concluir"}
                  </Button>
                  <Button
                    disabled={data.pending}
                    variant="ghost"
                    onClick={() => setEditor(task)}
                    aria-label={`Editar tarefa: ${task.title}`}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={data.pending}
                    aria-label={`Arquivar tarefa: ${task.title}`}
                    onClick={async () => {
                      const result = await data.archiveTask(task.id);
                      setMessage(
                        result.valid
                          ? "Tarefa arquivada. Prioridades vinculadas foram preservadas."
                          : result.reason,
                      );
                    }}
                  >
                    Arquivar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {message && (
          <p role="status" className="mt-3 text-sm">
            {message}
          </p>
        )}
      </SectionCard>
      <ProjectManager creating={projectDialog} onCreatingChange={setProjectDialog} />
      <details
        className="rounded-lg border p-4"
        open={!data.categories.some((item) => item.active) || undefined}
      >
        <summary className="cursor-pointer text-sm font-medium">Categorias de tarefas</summary>
        <div className="mt-4">
          <CategoryCreator />
        </div>
      </details>
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !data.saving) setEditor(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editor === "new" ? "Nova tarefa" : "Editar tarefa"}</DialogTitle>
            <DialogDescription>
              Defina a ação, a categoria e os detalhes opcionais.
            </DialogDescription>
          </DialogHeader>
          {editor !== null && (
            <TaskEditor
              key={editor === "new" ? "new" : editor.id}
              task={editor === "new" ? null : editor}
              onSaved={() => {
                setEditor(null);
                setMessage("Tarefa salva.");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskEditor({ task, onSaved }: { task: UserTask | null; onSaved: () => void }) {
  const data = useTaskData();
  const [draft, setDraft] = useState<TaskDraft>(() => ({
    title: task?.title ?? "",
    category_id: task?.category_id ?? "",
    project_id: task?.project_id ?? null,
    priority: task?.priority ?? "Média",
    due_date: task?.due_date ?? null,
    status: task?.status ?? "A fazer",
    estimate_min: task?.estimate_min ?? 30,
  }));
  const [error, setError] = useState("");
  const categories = data.categories.filter((item) => item.active || item.id === task?.category_id);
  const projects = data.projects.filter((item) => item.active || item.id === task?.project_id);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await data.saveTask(draft, task?.id);
        if (result.valid) onSaved();
        else setError(result.reason);
      }}
    >
      <label className="grid gap-1 text-sm">
        Título
        <Input
          autoFocus
          required
          maxLength={300}
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </label>
      <DataSelect
        label="Categoria"
        required
        value={draft.category_id}
        onChange={(event) => setDraft({ ...draft, category_id: event.target.value })}
      >
        <option value="">Selecione uma categoria</option>
        {categories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {!item.active && " (desativada)"}
          </option>
        ))}
      </DataSelect>
      {!categories.length && (
        <p className="text-sm">
          Você precisa de uma categoria ativa. Feche este formulário e use “Categorias de tarefas”
          abaixo da lista para criar ou reativar uma categoria.
        </p>
      )}
      <DataSelect
        label="Projeto (opcional)"
        value={draft.project_id ?? ""}
        onChange={(event) => setDraft({ ...draft, project_id: event.target.value || null })}
      >
        <option value="">Sem projeto</option>
        {projects.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {!item.active && " (arquivado)"}
          </option>
        ))}
      </DataSelect>
      <div className="grid gap-3 sm:grid-cols-2">
        <DataSelect
          label="Prioridade"
          value={draft.priority}
          onChange={(event) => setDraft({ ...draft, priority: event.target.value as TaskPriority })}
        >
          {["Alta", "Média", "Baixa"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </DataSelect>
        <DataSelect
          label="Status"
          value={draft.status}
          onChange={(event) => setDraft({ ...draft, status: event.target.value as TaskStatus })}
        >
          {["A fazer", "Em andamento", "Aguardando", "Concluída"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </DataSelect>
      </div>
      <label className="grid gap-1 text-sm">
        Prazo (opcional)
        <Input
          type="date"
          value={draft.due_date ?? ""}
          onChange={(event) => setDraft({ ...draft, due_date: event.target.value || null })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Duração estimada (minutos)
        <Input
          type="number"
          required
          min={0}
          max={2147483647}
          step={1}
          value={draft.estimate_min}
          onChange={(event) =>
            setDraft({
              ...draft,
              estimate_min: event.target.value === "" ? 0 : Number(event.target.value),
            })
          }
        />
        <span className="text-xs text-muted-foreground">Use 0 para deixar sem estimativa.</span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        disabled={
          data.pending ||
          !draft.title.trim() ||
          !draft.category_id ||
          !Number.isInteger(draft.estimate_min) ||
          draft.estimate_min < 0
        }
      >
        {data.pending ? "Salvando…" : "Salvar tarefa"}
      </Button>
    </form>
  );
}
