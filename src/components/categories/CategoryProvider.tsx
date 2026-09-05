import { useMemo, useState, type ReactNode } from "react";

import {
  CategoryContext,
  type CategoryContextValue,
} from "@/components/categories/category-context";
import {
  categories as demoCategories,
  categoryColor as demoCategoryColor,
  categoryName as demoCategoryName,
  type Category,
  validateCategoryActivation,
  validateCategoryCreation,
  validateCategoryDeactivation,
} from "@/lib/demo-data";

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() =>
    demoCategories.map((category) => ({ ...category })),
  );

  const value = useMemo<CategoryContextValue>(
    () => ({
      categories,
      categoryName: (id) =>
        categories.find((category) => category.id === id)?.name ?? demoCategoryName(id),
      categoryColor: (id) =>
        categories.find((category) => category.id === id)?.color ?? demoCategoryColor(id),
      createCategory: (name) => {
        const category: Pick<Category, "name" | "source" | "active"> = {
          name,
          source: "user",
          active: true,
        };
        const validation = validateCategoryCreation(categories, category);
        if (!validation.valid) return validation;

        const nextId =
          categories.reduce((max, item) => {
            if (item.source !== "user") return max;
            const match = item.id.match(/^custom-(\d+)$/);
            return match ? Math.max(max, Number(match[1])) : max;
          }, 0) + 1;
        setCategories((current) => [
          ...current,
          {
            id: `custom-${nextId}`,
            name: name.trim(),
            kind: "Pessoal",
            color: "var(--color-chart-2)",
            source: "user",
            active: true,
          },
        ]);
        return { valid: true };
      },
      renameCategory: (id, name) => {
        if (!name.trim()) return { valid: false, reason: "O nome da categoria é obrigatório." };
        if (
          categories.some(
            (category) =>
              category.id !== id &&
              category.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
          )
        ) {
          return { valid: false, reason: "Já existe uma categoria com esse nome." };
        }
        if (!categories.some((category) => category.id === id)) {
          return { valid: false, reason: "Categoria não encontrada." };
        }
        setCategories((current) =>
          current.map((category) =>
            category.id === id ? { ...category, name: name.trim() } : category,
          ),
        );
        return { valid: true };
      },
      activateCategory: (id) => {
        const validation = validateCategoryActivation(categories, id);
        if (!validation.valid) return validation;
        setCategories((current) =>
          current.map((category) =>
            category.id === id ? { ...category, active: true } : category,
          ),
        );
        return { valid: true };
      },
      deactivateCategory: (id) => {
        const validation = validateCategoryDeactivation(categories, id);
        if (!validation.valid) return validation;
        setCategories((current) =>
          current.map((category) =>
            category.id === id ? { ...category, active: false } : category,
          ),
        );
        return { valid: true };
      },
    }),
    [categories],
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}
