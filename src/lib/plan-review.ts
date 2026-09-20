import type { Habit, HabitCheckIn } from "@/lib/habit-data";
import type { UserProject, UserTask } from "@/lib/task-data";

export type PlanBucket = "atrasadas" | "proximas" | "semPrazo" | "outras";

export function taskBucket(task: Pick<UserTask, "due_date" | "status">, today: string): PlanBucket {
  if (task.status === "Concluída") return "outras";
  if (!task.due_date) return "semPrazo";
  if (task.due_date < today) return "atrasadas";
  if (task.due_date <= addDays(today, 7)) return "proximas";
  return "outras";
}

export function projectProgress(tasks: readonly UserTask[], projectId: string) {
  const items = tasks.filter((task) => task.project_id === projectId && !task.archived);
  const done = items.filter((task) => task.status === "Concluída").length;
  return {
    total: items.length,
    done,
    percent: items.length ? Math.round((done / items.length) * 100) : 0,
  };
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function currentWeek(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  const day = value.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  value.setUTCDate(value.getUTCDate() + mondayOffset);
  const start = value.toISOString().slice(0, 10);
  return { start, end: addDays(start, 6) };
}

export function habitReview(
  habits: readonly Habit[],
  checkIns: readonly HabitCheckIn[],
  start: string,
  end: string,
) {
  const scheduled = habits.filter((habit) => habit.active);
  const records = checkIns.filter((item) => item.date >= start && item.date <= end);
  const completed = records.filter((item) => item.completed).length;
  const expected = scheduled.length * 7;
  return {
    completed,
    expected,
    percent: expected ? Math.round((completed / expected) * 100) : 0,
    records,
  };
}

export function reviewSummary(
  tasks: readonly UserTask[],
  projects: readonly UserProject[],
  habits: readonly Habit[],
  checkIns: readonly HabitCheckIn[],
  today: string,
) {
  const { start, end } = currentWeek(today);
  const open = tasks.filter((task) => !task.archived && task.status !== "Concluída");
  const completed = tasks.filter(
    (task) =>
      task.status === "Concluída" &&
      task.updated_at.slice(0, 10) >= start &&
      task.updated_at.slice(0, 10) <= end,
  );
  const overdue = open.filter((task) => task.due_date && task.due_date < today);
  const noDue = open.filter((task) => !task.due_date);
  const activeProjects = projects.filter((project) => project.active);
  const habitsResult = habitReview(habits, checkIns, start, end);
  const alerts = [
    ...(overdue.length
      ? [
          `${overdue.length} ${overdue.length === 1 ? "tarefa está" : "tarefas estão"} atrasada${overdue.length === 1 ? "" : "s"}.`,
        ]
      : []),
    ...(noDue.length >= 3 ? [`${noDue.length} tarefas abertas estão sem prazo.`] : []),
    ...(habitsResult.percent < 50 && habitsResult.expected
      ? ["A taxa de conclusão dos hábitos ficou abaixo de 50% nesta semana."]
      : []),
  ];
  return {
    start,
    end,
    completed,
    open,
    overdue,
    noDue,
    activeProjects,
    habits: habitsResult,
    alerts,
  };
}
