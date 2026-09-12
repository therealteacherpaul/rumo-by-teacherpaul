import { useContext } from "react";

import { HabitContext } from "@/components/habits/habit-context";

export function useHabits() {
  const context = useContext(HabitContext);
  if (!context) throw new Error("useHabits deve ser usado dentro de HabitProvider");
  return context;
}
