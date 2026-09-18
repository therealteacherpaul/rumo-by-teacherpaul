import { analyzePlanningInput } from "../planning-analysis.ts";
import type { PlanningInput, PlanningSuggestion } from "../planning-types.ts";

/** Explicit demo: no network, no persistence, no claims of AI generation. */
export function generateDemoPlan(input: PlanningInput): PlanningSuggestion {
  const linked = new Set(input.priorities.map((p) => p.taskId));
  const rank: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };
  const tasks = [...input.tasks].sort(
    (a, b) =>
      Number(linked.has(b.id)) - Number(linked.has(a.id)) ||
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
      (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3),
  );
  let remaining = input.availableMinutes;
  const suggestedBlocks: PlanningSuggestion["suggestedBlocks"] = [];
  for (const task of tasks) {
    if (remaining < 5) break;
    const minutes = Math.min(task.estimateMinutes || 25, 50, remaining);
    suggestedBlocks.push({
      id: `block-${task.id}`,
      taskId: task.id,
      title: task.title,
      minutes,
      reason: `${linked.has(task.id) ? "Vinculada a uma prioridade do dia." : "Ordenada pelo prazo e pela prioridade."} ${task.estimateMinutes ? `Estimativa original: ${task.estimateMinutes} min; o bloco pode cobrir só parte da tarefa.` : "Sem estimativa: 25 min é apenas um ponto de partida para revisão."}`,
    });
    remaining -= minutes;
  }
  return {
    source: "demo",
    summary: `Exemplo local: ${suggestedBlocks.length} blocos, ${input.availableMinutes - remaining} min de foco. Revise espaço para hábitos, pausas e prioridades antes de aceitar.`,
    suggestedBlocks,
    warnings: analyzePlanningInput(input).warnings,
    proposedChanges: tasks
      .filter((t) => t.estimateMinutes <= 0)
      .map((t) => ({
        id: `estimate-${t.id}`,
        taskId: t.id,
        kind: "estimate",
        minutes: 25,
        reason: "Definir uma estimativa inicial ajuda a comparar a carga com o tempo disponível.",
      })),
  };
}
