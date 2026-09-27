import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Input limits keep prompt size bounded and predictable.
const title = z.string().trim().min(1).max(200);
const id = z.string().trim().min(1).max(64);

const inputSchema = z.object({
  date: z.string().trim().min(1).max(32),
  availableMinutes: z.number().int().min(5).max(1440),
  tasks: z
    .array(
      z.object({
        id,
        title,
        priority: z.string().trim().max(40),
        dueDate: z.string().trim().max(40).nullable(),
        estimateMinutes: z.number().int().min(0).max(1440),
        projectId: z.string().trim().max(64).nullable(),
      }),
    )
    .max(50),
  projects: z.array(z.object({ id, name: title })).max(30),
  priorities: z
    .array(z.object({ id, title, taskId: z.string().trim().max(64).nullable() }))
    .max(20),
  habits: z
    .array(z.object({ id, name: title, minutes: z.number().int().min(0).max(1440).nullable() }))
    .max(20),
});

const planSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "suggestedBlocks", "warnings", "proposedChanges"],
  properties: {
    summary: { type: "string" },
    warnings: { type: "array", items: { type: "string" } },
    suggestedBlocks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "taskId", "title", "minutes", "reason"],
        properties: {
          id: { type: "string" },
          taskId: { type: "string" },
          title: { type: "string" },
          minutes: { type: "integer" },
          reason: { type: "string" },
        },
      },
    },
    proposedChanges: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "taskId", "kind", "minutes", "reason"],
        properties: {
          id: { type: "string" },
          taskId: { type: "string" },
          kind: { type: "string", enum: ["estimate"] },
          minutes: { type: "integer" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

function buildPrompt(data: z.infer<typeof inputSchema>) {
  return [
    "Você é o Planejador do dia do RUMO, em português do Brasil.",
    "Regras: nunca preencha todos os minutos; reserve folga para imprevistos e pausas;",
    "não sugira produtividade tóxica; a soma dos minutos dos blocos sugeridos NUNCA pode",
    `ultrapassar ${data.availableMinutes} minutos (use no máximo ~85% desse tempo).`,
    "Cada bloco e cada mudança proposta deve referenciar o campo taskId de uma tarefa existente,",
    "ter um id único e uma justificativa curta (campo reason) em português.",
    "Mudanças propostas são apenas sugestões de nova estimativa (kind = estimate).",
    "Máximo de 6 blocos, 4 mudanças propostas e 5 alertas (warnings). Textos curtos.",
    "",
    `Data: ${data.date}`,
    `Minutos disponíveis: ${data.availableMinutes}`,
    `Tarefas abertas: ${JSON.stringify(data.tasks)}`,
    `Projetos: ${JSON.stringify(data.projects)}`,
    `Prioridades do dia: ${JSON.stringify(data.priorities)}`,
    `Hábitos ativos: ${JSON.stringify(data.habits)}`,
  ].join("\n");
}

export const generateDayPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      return await runPlanner(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[planner] failed", message);
      const code = message.startsWith("planner_") ? message : "planner_unavailable";
      return { error: code } as const;
    }
  });

async function runPlanner(data: z.infer<typeof inputSchema>) {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      console.error("[planner] missing LOVABLE_API_KEY");
      throw new Error("planner_unavailable");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: buildPrompt(data),
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: 4000,
        text: {
          format: {
            type: "json_schema",
            name: "day_plan",
            strict: true,
            schema: planSchema,
          },
        },
      }),
    });

    if (!response.ok || !response.body) {
      const status = response.status;
      console.error("[planner] gateway status", status);
      if (status === 429) throw new Error("planner_rate_limited");
      if (status === 402 || status === 403) throw new Error("planner_credits");
      throw new Error("planner_unavailable");
    }

    // Read the SSE stream and accumulate only the answer text.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as { type?: string; delta?: string };
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            text += event.delta;
            if (text.length > 20000) throw new Error("planner_invalid");
          }
        } catch (error) {
          if (error instanceof Error && error.message === "planner_invalid") throw error;
        }
      }
    }

    const tail = buffer.trim();
    if (tail.startsWith("data:")) {
      try {
        const event = JSON.parse(tail.slice(5).trim()) as { type?: string; delta?: string };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") text += event.delta;
      } catch {
        /* ignore partial frame */
      }
    }
    if (!text.trim()) throw new Error("planner_invalid");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("planner_invalid");
    }
    return { ...(parsed as Record<string, unknown>), source: "ai" as const };
  }
