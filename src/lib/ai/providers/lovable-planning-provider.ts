import { generateDayPlan } from "../planning.functions.ts";
import { PlanningError, type PlanningProvider } from "../planning-types.ts";

const messages: Record<string, string> = {
  planner_unavailable:
    "A IA do Planejador está indisponível no momento. Seus dados continuam intactos; tente novamente em instantes.",
  planner_rate_limited:
    "Muitas solicitações em pouco tempo. Aguarde alguns instantes e gere o plano novamente.",
  planner_credits:
    "Os créditos de IA do espaço de trabalho acabaram. Recarregue os créditos para voltar a gerar planos.",
  planner_invalid: "A resposta do planejador veio incompleta. Tente gerar novamente.",
};

function describe(error: unknown) {
  const raw = error instanceof Error ? error.message : "";
  for (const key of Object.keys(messages)) if (raw.includes(key)) return messages[key]!;
  if (raw.toLowerCase().includes("unauthorized"))
    return "Sua sessão expirou. Entre novamente para usar o Planejador do dia.";
  return messages["planner_unavailable"]!;
}

/** Authenticated transport: calls the server function, which validates the session
 * and talks to the Lovable AI gateway. No key is ever exposed to the browser. */
export const lovablePlanningProvider: PlanningProvider = {
  id: "lovable",
  async generatePlan(input, signal) {
    signal.throwIfAborted();
    try {
      const result = (await generateDayPlan({ data: input, signal })) as Record<string, unknown>;
      if (typeof result["error"] === "string") throw new Error(result["error"]);
      return result as never;
    } catch (error) {
      if (signal.aborted) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new PlanningError("unavailable", describe(error));
    }
  },
};
