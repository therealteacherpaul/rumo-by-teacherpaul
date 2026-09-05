import { useContext } from "react";

import { CategoryContext } from "@/components/categories/category-context";

export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) throw new Error("useCategories deve ser usado dentro de CategoryProvider");
  return context;
}
