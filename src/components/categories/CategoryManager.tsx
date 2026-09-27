import { useState } from "react";

import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskData } from "@/hooks/use-task-data";
import { USER_CATEGORY_LIMITS, countCategories } from "@/lib/category-limits";
import { pluralize } from "@/lib/pluralize";

const suggestions = ["Trabalho", "Estudo", "Pessoal", "Saúde"];

/** Full authenticated category lifecycle: create, rename, archive, restore and delete. */
export function CategoryManager() {
  const data = useTaskData();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const counts = countCategories(data.categories);
  const active = data.categories.filter((category) => category.active);
  const archived = data.categories.filter((category) => !category.active);
  const usage = (id: string) => ({
    tasks: data.tasks.filter((task) => task.category_id === id).length,
    projects: data.projects.filter((project) => project.category_id === id).length,
  });

  const report = (result: { valid: true } | { valid: false; reason: string }, done: string) => {
    if (result.valid) {
      setMessage(done);
      setError("");
    } else {
      setError(result.reason);
      setMessage("");
    }
    return result.valid;
  };

  const create = async (value: string) => {
    if (await report(await data.createCategory(value), `Categoria “${value.trim()}” criada.`))
      setName("");
  };

  return (
    <SectionCard
      title="Suas categorias"
      description="Categorias organizam suas tarefas e projetos por área da vida."
    >
      <p className="text-sm text-muted-foreground">
        {counts.active} de {USER_CATEGORY_LIMITS.active} ativas · {counts.total} de{" "}
        {USER_CATEGORY_LIMITS.total} no total
        {counts.archived > 0 &&
          ` · ${counts.archived} ${pluralize(counts.archived, "arquivada", "arquivadas")}`}
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void create(name);
        }}
      >
        <Input
          value={name}
          maxLength={100}
          aria-label="Nome da nova categoria"
          placeholder="Nome da categoria"
          onChange={(event) => setName(event.target.value)}
        />
        <Button className="min-h-11" disabled={data.pending || !name.trim()}>
          Criar categoria
        </Button>
      </form>

      {!data.categories.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11"
              disabled={data.pending}
              onClick={() => void create(suggestion)}
            >
              + {suggestion}
            </Button>
          ))}
        </div>
      )}

      <ul className="mt-5 space-y-2">
        {active.map((category) => (
          <li
            key={category.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm"
          >
            {editing === category.id ? (
              <>
                <Input
                  className="max-w-xs"
                  value={editingName}
                  maxLength={100}
                  aria-label={`Novo nome de ${category.name}`}
                  onChange={(event) => setEditingName(event.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  className="min-h-11"
                  disabled={data.pending || !editingName.trim()}
                  onClick={async () => {
                    if (
                      report(
                        await data.renameCategory(category.id, editingName),
                        "Categoria renomeada.",
                      )
                    )
                      setEditing(null);
                  }}
                >
                  Salvar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <span className="mr-auto font-medium">{category.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  disabled={data.pending}
                  onClick={() => {
                    setEditing(category.id);
                    setEditingName(category.name);
                  }}
                >
                  Renomear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="min-h-11"
                  disabled={data.pending}
                  onClick={async () => {
                    report(
                      await data.setCategoryActive(category.id, false),
                      `Categoria “${category.name}” arquivada. Nenhuma tarefa foi alterada.`,
                    );
                  }}
                >
                  Arquivar
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>

      {archived.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold">Arquivadas</h3>
          <p className="text-xs text-muted-foreground">
            Categorias arquivadas não aparecem em novas tarefas, mas continuam visíveis nas tarefas
            antigas.
          </p>
          <ul className="space-y-2">
            {archived.map((category) => {
              const linked = usage(category.id);
              const blocked = linked.tasks > 0 || linked.projects > 0;
              return (
                <li
                  key={category.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-sm"
                >
                  <span className="mr-auto">
                    {category.name}
                    {blocked && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {linked.tasks} {pluralize(linked.tasks, "tarefa", "tarefas")} ·{" "}
                        {linked.projects} {pluralize(linked.projects, "projeto", "projetos")}
                      </span>
                    )}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11"
                    disabled={data.pending}
                    onClick={async () => {
                      report(
                        await data.setCategoryActive(category.id, true),
                        `Categoria “${category.name}” reativada.`,
                      );
                    }}
                  >
                    Reativar
                  </Button>
                  {confirmDelete === category.id ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="min-h-11"
                        disabled={data.pending}
                        onClick={async () => {
                          if (
                            report(
                              await data.deleteCategory(category.id),
                              `Categoria “${category.name}” excluída.`,
                            )
                          )
                            setConfirmDelete(null);
                        }}
                      >
                        Confirmar exclusão
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="min-h-11"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="min-h-11"
                      disabled={data.pending || blocked}
                      title={
                        blocked
                          ? "Esta categoria ainda tem itens vinculados."
                          : "Excluir definitivamente"
                      }
                      onClick={() => {
                        setConfirmDelete(category.id);
                        setMessage("");
                        setError("");
                      }}
                    >
                      Excluir
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-4 text-sm text-success">
          {message}
        </p>
      )}
    </SectionCard>
  );
}
