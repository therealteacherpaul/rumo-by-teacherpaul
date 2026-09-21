import { z } from "zod";
import { lovablePlanningProvider } from "./providers/lovable-planning-provider.ts";
import { generateDemoPlan } from "./providers/demo-planning-provider.ts";
import {
  PlanningError,
  type PlanningInput,
  type PlanningOptions,
  type PlanningProvider,
  type PlanningSuggestion,
} from "./planning-types.ts";

const text = z.string().trim().min(1).max(2000);
const minutes = z.number().int().min(1).max(1440);
const schema = z.object({
  source: z.enum(["ai", "demo"]),
  summary: text,
  suggestedBlocks: z
    .array(z.object({ id: text, taskId: text, title: text, minutes, reason: text }))
    .max(100),
  warnings: z.array(text).max(1000),
  proposedChanges: z
    .array(
      z.object({
        id: text,
        taskId: text,
        kind: z.enum(["estimate", "priority", "dueDate", "todayPriority"]),
        minutes,
        reason: text,
        value: z.string().nullable().optional(),
      }),
    )
    .max(100),
});
export function validatePlan(
  value: unknown,
  input: PlanningInput,
  mode: PlanningOptions["mode"],
): PlanningSuggestion {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new PlanningError(
      "invalid",
      "A resposta do planejador está incompleta. Tente gerar novamente.",
    );
  const plan = result.data;
  const ids = new Set<string>();
  for (const item of [...plan.suggestedBlocks, ...plan.proposedChanges]) {
    if (ids.has(item.id) || !input.tasks.some((t) => t.id === item.taskId))
      throw new PlanningError(
        "invalid",
        "A resposta contém tarefas indisponíveis ou sugestões repetidas. Gere novamente.",
      );
    ids.add(item.id);
  }
  if (
    plan.source !== (mode === "demo" ? "demo" : "ai") ||
    plan.suggestedBlocks.reduce((sum, b) => sum + b.minutes, 0) > input.availableMinutes
  )
    throw new PlanningError(
      "invalid",
      "O plano não corresponde ao modo ou ao tempo disponível. Gere novamente.",
    );
  return plan;
}
export function createPlanningService(provider: PlanningProvider, timeoutMs = 60000) {
  return {
    async generatePlan(
      input: PlanningInput,
      options: PlanningOptions,
    ): Promise<PlanningSuggestion> {
      if (
        !Number.isInteger(input.availableMinutes) ||
        input.availableMinutes < 5 ||
        input.availableMinutes > 1440
      )
        throw new PlanningError("invalid", "Informe entre 5 e 1440 minutos disponíveis.");
      const controller = new AbortController();
      const abort = () => controller.abort();
      options.signal?.addEventListener("abort", abort, { once: true });
      if (options.signal?.aborted) controller.abort();
      let timeout: ReturnType<typeof setTimeout> | undefined;
      let onAbort: (() => void) | undefined;
      try {
        controller.signal.throwIfAborted();
        const cancelled = new Promise<never>((_, reject) => {
          onAbort = () => reject(new DOMException("Operação cancelada", "AbortError"));
          controller.signal.addEventListener("abort", onAbort, { once: true });
        });
        const deadline = new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            reject(new PlanningError("timeout", "A IA demorou para responder. Tente novamente."));
            controller.abort();
          }, timeoutMs);
        });
        const result = await Promise.race([
          options.mode === "demo"
            ? Promise.resolve(generateDemoPlan(input))
            : provider.generatePlan(input, controller.signal),
          deadline,
          cancelled,
        ]);
        controller.signal.throwIfAborted();
        return validatePlan(result, input, options.mode);
      } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener("abort", abort);
        if (onAbort) controller.signal.removeEventListener("abort", onAbort);
      }
    },
  };
}
export const planningService = createPlanningService(lovablePlanningProvider);
