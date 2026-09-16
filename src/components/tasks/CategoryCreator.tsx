import { useState } from "react";
import { useTaskData } from "@/hooks/use-task-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/common/SectionCard";

// Only the small prerequisite needed by a new account to create its first task.
export function CategoryCreator() {
  const { createCategory, activateCategory, categories, pending } = useTaskData();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  return (
    <SectionCard
      title="Categorias de tarefas"
      description="Crie uma categoria para organizar suas tarefas. Até quatro categorias personalizadas."
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
        <Button disabled={pending || !name.trim() || categories.length >= 4}>
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
            disabled={pending}
            onClick={async () => {
              const result = await activateCategory(category.id);
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
