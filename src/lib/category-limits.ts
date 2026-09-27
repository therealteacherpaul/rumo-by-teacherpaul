import type { WriteResult } from "./task-data";

/** Per-user limits enforced both here and by the database triggers. */
export const USER_CATEGORY_LIMITS = { active: 20, total: 30 } as const;

export type CategoryLike = { id: string; name: string; active: boolean };

const normalized = (name: string) => name.trim().toLocaleLowerCase();

export const countCategories = (items: readonly CategoryLike[]) => ({
  total: items.length,
  active: items.filter((item) => item.active).length,
  archived: items.filter((item) => !item.active).length,
});

function validateName(
  items: readonly CategoryLike[],
  name: string,
  excludedId?: string,
): WriteResult {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100)
    return { valid: false, reason: "Informe um nome de categoria com até 100 caracteres." };
  if (items.some((item) => item.id !== excludedId && normalized(item.name) === normalized(trimmed)))
    return { valid: false, reason: "Já existe uma categoria com esse nome." };
  return { valid: true };
}

export function validateCategoryCreation(
  items: readonly CategoryLike[],
  name: string,
): WriteResult {
  const nameCheck = validateName(items, name);
  if (!nameCheck.valid) return nameCheck;
  const counts = countCategories(items);
  if (counts.total >= USER_CATEGORY_LIMITS.total)
    return {
      valid: false,
      reason: `Limite de ${USER_CATEGORY_LIMITS.total} categorias no total atingido. Exclua uma categoria arquivada para criar outra.`,
    };
  if (counts.active >= USER_CATEGORY_LIMITS.active)
    return {
      valid: false,
      reason: `Limite de ${USER_CATEGORY_LIMITS.active} categorias ativas atingido. Arquive uma categoria para criar outra.`,
    };
  return { valid: true };
}

export function validateCategoryRename(
  items: readonly CategoryLike[],
  id: string,
  name: string,
): WriteResult {
  if (!items.some((item) => item.id === id))
    return { valid: false, reason: "Categoria não encontrada." };
  return validateName(items, name, id);
}

export function validateCategoryActivation(
  items: readonly CategoryLike[],
  id: string,
  active: boolean,
): WriteResult {
  const category = items.find((item) => item.id === id);
  if (!category) return { valid: false, reason: "Categoria não encontrada." };
  if (category.active === active) return { valid: true };
  if (active && countCategories(items).active >= USER_CATEGORY_LIMITS.active)
    return {
      valid: false,
      reason: `Limite de ${USER_CATEGORY_LIMITS.active} categorias ativas atingido. Arquive outra categoria antes de reativar esta.`,
    };
  return { valid: true };
}

export function validateCategoryDeletion(
  items: readonly CategoryLike[],
  id: string,
  usage: { tasks: number; projects: number },
): WriteResult {
  const category = items.find((item) => item.id === id);
  if (!category) return { valid: false, reason: "Categoria não encontrada." };
  if (category.active)
    return { valid: false, reason: "Arquive a categoria antes de excluí-la definitivamente." };
  if (usage.tasks > 0 || usage.projects > 0)
    return {
      valid: false,
      reason:
        "Esta categoria ainda tem tarefas ou projetos vinculados. Reative-a ou mova esses itens para outra categoria antes de excluir. Nenhuma tarefa é apagada.",
    };
  return { valid: true };
}
