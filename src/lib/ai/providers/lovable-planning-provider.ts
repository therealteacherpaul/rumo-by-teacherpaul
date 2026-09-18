import { PlanningError, type PlanningProvider } from "../planning-types.ts";

/** No deployed authenticated planning endpoint has been verified for this project.
 * Never call the AI gateway or expose LOVABLE_API_KEY in browser code.
 * Replace this implementation with a verified authenticated backend transport only.
 */
export const lovablePlanningProvider: PlanningProvider = {
  id: "lovable",
  async generatePlan(_input, signal) {
    signal.throwIfAborted();
    throw new PlanningError(
      "unavailable",
      "A IA do Planejador ainda não está conectada. Suas tarefas continuam disponíveis; use as verificações locais e tente novamente após a ativação.",
    );
  },
};
