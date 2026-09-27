import { useState } from "react";
import { useTaskData } from "@/hooks/use-task-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/common/SectionCard";
import { USER_CATEGORY_LIMITS, countCategories } from "@/lib/category-limits";

// Quick creation and restore next to the task list; full management lives in Configurações.
export function CategoryCreator() {
  const { createCategory, setCategoryActive, categories, pending } = useTaskData();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const counts = countCategories(categories);
  const full =
    counts.total >= USER_CATEGORY_LIMITS.total || counts.active >= USER_CATEGORY_LIMITS.active;
  return (
    <SectionCard
      title="Categorias de tarefas"
      description={`Organize suas tarefas por área. ${counts.active} de ${USER_CATEGORY_LIMITS.active} ativas · ${counts.total} de ${USER_CATEGORY_LIMITS.total} no total.`}
    >
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await createCategory(name);
          setMessage(result.valid ? "Categoria criada." : result.reason);
          if (result.valid) setName("");
        }}
      >
        <Input
          className="max-w-sm"
          required
          maxLength={100}
          aria-label="Nome da nova categoria"
          placeholder="Nome da categoria"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button className="min-h-11" disabled={pending || !name.trim() || full}>
          Criar categoria
        </Button>
      </form>
      {categories
        .filter((category) => !category.active)
        .map((category) => (
          <Button
            type="button"
            key={category.id}
            variant="outline"
            className="mt-2 mr-2 min-h-11"
            disabled={pending}
            onClick={async () => {
              const result = await setCategoryActive(category.id, true);
              setMessage(result.valid ? "Categoria reativada." : result.reason);
            }}
          >
            Reativar {category.name}
          </Button>
        ))}
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
    </SectionCard>
  );
}
