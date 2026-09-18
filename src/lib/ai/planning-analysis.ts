import type { PlanningInput } from "./planning-types.ts";

/** Deterministic checks only. These are never presented as a generated AI plan. */
export function analyzePlanningInput(input: PlanningInput) {
  const warnings: string[] = [];
  const soon = new Date(`${input.date}T12:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + 2);
  const soonDate = soon.toISOString().slice(0, 10);
  const linked = new Set(input.priorities.flatMap((p) => (p.taskId ? [p.taskId] : [])));
  const overdue = input.tasks.filter((t) => t.dueDate && t.dueDate < input.date);
  const near = input.tasks.filter(
    (t) => t.dueDate && t.dueDate >= input.date && t.dueDate <= soonDate,
  );
  for (const t of overdue)
    warnings.push(`Atrasada: “${t.title}”. Prazo ${t.dueDate}; revise o que ainda cabe hoje.`);
  for (const t of near) warnings.push(`Prazo próximo: “${t.title}” vence em ${t.dueDate}.`);
  const unestimated = input.tasks.filter((t) => t.estimateMinutes <= 0);
  for (const t of unestimated)
    warnings.push(`Sem duração: estime “${t.title}” antes de reservar um bloco.`);
  const taskMinutes = input.tasks.reduce((sum, t) => sum + t.estimateMinutes, 0);
  const habitMinutes = input.habits.reduce((sum, h) => sum + (h.minutes ?? 0), 0);
  if (taskMinutes + habitMinutes > input.availableMinutes) {
    warnings.push(
      `A fila aberta soma ${taskMinutes} min e os hábitos com meta de tempo somam ${habitMinutes} min, acima dos ${input.availableMinutes} min disponíveis. Escolha um recorte para hoje; nem toda tarefa aberta precisa ser feita hoje.`,
    );
  }
  if (input.habits.length)
    warnings.push(
      "Hábitos: as metas de tempo são uma reserva indicativa. Confira a frequência de hoje; água e outras metas sem minutos não entram na soma.",
    );
  const priorityMinutes = input.tasks
    .filter((t) => linked.has(t.id))
    .reduce((sum, t) => sum + t.estimateMinutes, 0);
  if (priorityMinutes > input.availableMinutes)
    warnings.push(
      "Conflito de prioridades: só as tarefas vinculadas às prioridades já excedem seu tempo disponível.",
    );
  const seen = new Set<string>();
  for (const p of input.priorities) {
    if (!p.taskId)
      warnings.push(
        `Prioridade “${p.title}” sem tarefa vinculada: reserve tempo para ela antes de preencher o dia.`,
      );
    else if (seen.has(p.taskId))
      warnings.push(
        `Conflito: mais de uma prioridade aponta para a mesma tarefa (“${p.title}”). Evite contar o tempo duas vezes.`,
      );
    else if (!input.tasks.some((t) => t.id === p.taskId))
      warnings.push(`Revise “${p.title}”: sua tarefa não está na lista de tarefas abertas.`);
    if (p.taskId) seen.add(p.taskId);
  }
  if (linked.size && [...overdue, ...near].some((t) => !linked.has(t.id)))
    warnings.push(
      "Conflito possível: há prazos urgentes fora das prioridades escolhidas. Compare-os antes de aceitar blocos.",
    );
  return { warnings, taskMinutes, habitMinutes, unestimated: unestimated.length };
}
