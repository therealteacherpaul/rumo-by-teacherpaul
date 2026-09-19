import { useHabits } from "@/hooks/use-habits";
import { useTaskData } from "@/hooks/use-task-data";
import type { Tables } from "@/integrations/supabase/types";
import type { PlanningInput } from "@/lib/ai/planning-types";
import { DayPlanner } from "./DayPlanner";

export function AuthenticatedDayPlanner({
  priorities,
  date,
  unavailable,
}: {
  priorities: Tables<"priorities">[];
  date: string;
  unavailable: boolean;
}) {
  const data = useTaskData();
  const { activeHabits, loading: habitsLoading, error: habitsError } = useHabits();
  const sourcesUnavailable = unavailable || habitsLoading || Boolean(habitsError);
  const input: PlanningInput = {
    date,
    availableMinutes: 180,
    tasks: data.tasks
      .filter((task) => !task.archived && task.status !== "Concluída")
      .map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.due_date,
        estimateMinutes: task.estimate_min ?? 0,
        projectId: task.project_id,
      })),
    projects: data.projects.map((project) => ({ id: project.id, name: project.name })),
    priorities: priorities
      .filter((p) => !p.done)
      .map((p) => ({ id: p.id, title: p.title, taskId: p.task_id })),
    habits: activeHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      minutes: habit.target.type === "durationMin" ? habit.target.target : null,
    })),
  };
  // Any source change discards previous suggestions and aborts in-flight generation.
  return (
    <DayPlanner
      key={JSON.stringify([input, sourcesUnavailable])}
      input={input}
      mode="authenticated"
      unavailable={sourcesUnavailable}
    />
  );
}
