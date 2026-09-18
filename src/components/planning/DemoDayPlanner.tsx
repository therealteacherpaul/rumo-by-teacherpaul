import { useHabits } from "@/hooks/use-habits";
import { tasks, todayPriorities } from "@/lib/demo-data";
import type { PlanningInput } from "@/lib/ai/planning-types";
import { DayPlanner } from "./DayPlanner";

export function DemoDayPlanner({ completedIds }: { completedIds: Set<string> }) {
  const { activeHabits } = useHabits();
  const input: PlanningInput = {
    date: "2026-09-02",
    availableMinutes: 180,
    tasks: tasks
      .filter((task) => task.status !== "Concluída")
      .map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.due,
        estimateMinutes: task.estimateMin,
        projectId: task.project,
      })),
    projects: [...new Set(tasks.map((task) => task.project))].map((name) => ({ id: name, name })),
    priorities: todayPriorities
      .filter((p) => !completedIds.has(p.id))
      .map((p) => ({ id: p.id, title: p.title, taskId: null })),
    habits: activeHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      minutes: habit.target.type === "durationMin" ? habit.target.target : null,
    })),
  };
  return <DayPlanner key={JSON.stringify(input)} input={input} mode="demo" />;
}
