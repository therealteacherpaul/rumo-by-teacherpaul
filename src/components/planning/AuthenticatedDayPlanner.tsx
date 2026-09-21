import { useHabits } from "@/hooks/use-habits";
import { useTaskData } from "@/hooks/use-task-data";
import type { Tables } from "@/integrations/supabase/types";
import type { PlanningInput } from "@/lib/ai/planning-types";
import { DayPlanner } from "./DayPlanner";
import type { PlanningSuggestion } from "@/lib/ai/planning-types";
import { supabase } from "@/integrations/supabase/client";

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
      onApply={async (suggestion) => {
        const accepted = suggestion.proposedChanges;
        const failures: string[] = [];
        for (const change of accepted) {
          const task = data.tasks.find((item) => item.id === change.taskId);
          if (!task) {
            failures.push(change.id);
            continue;
          }
          const payload =
            change.kind === "estimate"
              ? { estimate_min: change.minutes }
              : change.kind === "priority"
                ? { priority: change.value ?? task.priority }
                : change.kind === "dueDate"
                  ? { due_date: change.value ?? null }
                  : null;
          if (payload) {
            const result = await data.saveTask(
              {
                ...task,
                title: task.title,
                category_id: task.category_id,
                project_id: task.project_id,
                status: task.status,
                ...payload,
              },
              task.id,
            );
            if (!result.valid) failures.push(change.id);
          } else if (change.kind === "todayPriority" && change.value) {
            const currentUser = (await supabase.auth.getUser()).data.user;
            if (!currentUser) {
              failures.push(change.id);
              continue;
            }
            const result = await supabase.from("priorities").insert({
              user_id: currentUser.id,
              title: change.value,
              date,
              slot:
                ([1, 2, 3] as number[]).find(
                  (slot) => !priorities.some((priority) => priority.slot === slot),
                ) ?? 1,
            });
            if (result.error) failures.push(change.id);
          }
        }
        if (failures.length) throw new Error(`Não foi possível aplicar: ${failures.join(", ")}`);
      }}
    />
  );
}
