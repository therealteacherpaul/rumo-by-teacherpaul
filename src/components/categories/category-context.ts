import { createContext } from "react";

import type { Category, CategoryId, CategoryValidation } from "@/lib/demo-data";

export type CategoryContextValue = {
  categories: Category[];
  categoryName: (id: CategoryId) => string;
  categoryColor: (id: CategoryId) => string;
  createCategory: (name: string) => CategoryValidation;
  renameCategory: (id: CategoryId, name: string) => CategoryValidation;
  activateCategory: (id: CategoryId) => CategoryValidation;
  deactivateCategory: (id: CategoryId) => CategoryValidation;
};

export const CategoryContext = createContext<CategoryContextValue | null>(null);
