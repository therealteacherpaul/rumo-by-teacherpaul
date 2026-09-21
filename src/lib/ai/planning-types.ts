export type PlanningTask = {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  estimateMinutes: number;
  projectId: string | null;
};
export type PlanningPriority = { id: string; title: string; taskId: string | null };
export type PlanningHabit = { id: string; name: string; minutes: number | null };
export type PlanningInput = {
  date: string;
  tasks: PlanningTask[];
  projects: { id: string; name: string }[];
  habits: PlanningHabit[];
  priorities: PlanningPriority[];
  availableMinutes: number;
};
export type SuggestedBlock = {
  id: string;
  taskId: string;
  title: string;
  minutes: number;
  reason: string;
};
export type ProposedChange = {
  id: string;
  taskId: string;
  kind: "estimate" | "priority" | "dueDate" | "todayPriority";
  minutes: number;
  reason: string;
  value?: string | null | undefined;
};
export type PlanningSuggestion = {
  source: "ai" | "demo";
  summary: string;
  suggestedBlocks: SuggestedBlock[];
  warnings: string[];
  proposedChanges: ProposedChange[];
};
export type PlanningOptions = { mode: "authenticated" | "demo"; signal?: AbortSignal };
export interface PlanningProvider {
  readonly id: "lovable" | "gemini";
  generatePlan(input: PlanningInput, signal: AbortSignal): Promise<unknown>;
}
// Contract only; no SDK, endpoint or credentials are configured for Gemini.
export interface GeminiPlanningProvider extends PlanningProvider {
  readonly id: "gemini";
}
// Contract only: reminders need separate authorization, storage and delivery implementation.
export interface PlanningReminderPort {
  scheduleAfterConfirmation(reminder: {
    taskId: string;
    at: string;
    channel: "in-app" | "push";
  }): Promise<void>;
}
export class PlanningError extends Error {
  readonly code: "unavailable" | "invalid" | "timeout";
  constructor(code: "unavailable" | "invalid" | "timeout", message: string) {
    super(message);
    this.code = code;
    this.name = "PlanningError";
  }
}
