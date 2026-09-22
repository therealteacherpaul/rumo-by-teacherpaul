import type { AlertItem, AlertPreferences } from "./alert-types";
type Task = {
  id: string;
  title: string;
  due_date: string | null;
  archived: boolean;
  status: string;
};
type Priority = { id: string; title: string; done: boolean };
type Habit = { id: string; name: string; active: boolean };
type Focus = { id: string; task_id: string | null; planned_minutes: number; status: string };

export function buildAlerts(input: {
  tasks: readonly Task[];
  priorities: readonly Priority[];
  habits: readonly Habit[];
  focus: readonly Focus[];
  date?: string;
  preferences?: AlertPreferences;
}): AlertItem[] {
  const today = input.date ?? new Date().toISOString().slice(0, 10);
  const prefs = input.preferences;
  if (prefs && !prefs.enabled) return [];
  const alerts: AlertItem[] = [];
  for (const task of input.tasks) {
    if (task.archived || task.status === "Concluída" || !task.due_date) continue;
    const days = Math.ceil(
      (Date.parse(`${task.due_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000,
    );
    if (days < 0)
      alerts.push({
        id: `overdue:${task.id}`,
        kind: "overdue",
        title: `Tarefa atrasada: ${task.title}`,
        reason: `O prazo venceu em ${task.due_date}.`,
        actionLabel: "Abrir tarefa",
        href: "/tasks",
        severity: "attention",
      });
    else if (days <= (prefs?.deadlineLeadDays ?? 2))
      alerts.push({
        id: `deadline:${task.id}`,
        kind: "deadline",
        title: `Prazo próximo: ${task.title}`,
        reason: `O prazo é ${task.due_date}.`,
        actionLabel: "Revisar tarefa",
        href: "/tasks",
        severity: "info",
      });
  }
  if (prefs?.focusEnabled !== false) {
    const seenFocus = new Set<string>();
    for (const session of input.focus) {
      if (session.status === "completed" || session.status === "cancelled") continue;
      const focusKey = session.task_id ?? session.id;
      if (seenFocus.has(focusKey)) continue;
      seenFocus.add(focusKey);
      alerts.push({
        id: `focus:${focusKey}`,
        kind: "focus",
        title: "Bloco de foco planejado",
        reason: `${session.planned_minutes} minutos reservados para execução.`,
        actionLabel: "Abrir Focus",
        href: "/focus",
        severity: "info",
      });
    }
  }
  if (prefs?.habitsEnabled !== false)
    for (const habit of input.habits)
      if (habit.active)
        alerts.push({
          id: `habit:${habit.id}:${today}`,
          kind: "habit",
          title: `Hábito pendente: ${habit.name}`,
          reason: "Ainda não há registro para hoje.",
          actionLabel: "Abrir hábitos",
          href: "/habits",
          severity: "info",
        });
  for (const priority of input.priorities)
    if (!priority.done)
      alerts.push({
        id: `priority:${priority.id}`,
        kind: "priority",
        title: `Prioridade aberta: ${priority.title}`,
        reason: "Esta prioridade ainda não foi executada hoje.",
        actionLabel: "Abrir Today",
        href: "/today",
        severity: "info",
      });
  return alerts;
}
