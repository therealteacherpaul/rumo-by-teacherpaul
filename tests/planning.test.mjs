import test from "node:test";
import assert from "node:assert/strict";
import { analyzePlanningInput } from "../src/lib/ai/planning-analysis.ts";
import {
  createPlanningService,
  planningService,
  validatePlan,
} from "../src/lib/ai/planning-service.ts";
const input = {
  date: "2026-09-18",
  availableMinutes: 60,
  tasks: [
    {
      id: "a",
      title: "Atrasada",
      priority: "Alta",
      dueDate: "2026-09-17",
      estimateMinutes: 90,
      projectId: null,
    },
    {
      id: "b",
      title: "Próxima",
      priority: "Média",
      dueDate: "2026-09-20",
      estimateMinutes: 0,
      projectId: "p",
    },
  ],
  projects: [{ id: "p", name: "Projeto" }],
  habits: [{ id: "h", name: "Ler", minutes: 10 }],
  priorities: [
    { id: "p1", title: "Primeira", taskId: "a" },
    { id: "p2", title: "Segunda", taskId: "a" },
  ],
};
const emptyPlan = {
  source: "ai",
  summary: "Plano",
  suggestedBlocks: [],
  warnings: [],
  proposedChanges: [],
};
test("detects overdue, near deadline, missing duration, overload and competing priorities", () => {
  const warnings = analyzePlanningInput(input).warnings.join("\n");
  for (const text of [
    "Atrasada:",
    "Prazo próximo:",
    "Sem duração:",
    "acima dos 60",
    "Conflito de prioridades:",
    "mesma tarefa",
    "fora das prioridades",
  ])
    assert.ok(warnings.includes(text), text);
});
test("today is not overdue and two-day window crosses month boundaries", () => {
  const warnings = analyzePlanningInput({
    ...input,
    date: "2026-09-30",
    tasks: [
      { ...input.tasks[1], dueDate: "2026-10-02" },
      { ...input.tasks[0], dueDate: "2026-09-30" },
    ],
  }).warnings;
  assert.equal(warnings.filter((w) => w.startsWith("Prazo próximo:")).length, 2);
  assert.equal(warnings.filter((w) => w.startsWith("Atrasada:")).length, 0);
});
test("demo never calls real provider; output fits available minutes and does not mutate inputs", async () => {
  let calls = 0;
  const service = createPlanningService({
    id: "gemini",
    async generatePlan() {
      calls++;
      throw new Error("must not call");
    },
  });
  const before = structuredClone(input);
  const plan = await service.generatePlan(input, { mode: "demo" });
  assert.equal(calls, 0);
  assert.equal(plan.source, "demo");
  assert.ok(plan.suggestedBlocks.reduce((s, b) => s + b.minutes, 0) <= 60);
  assert.deepEqual(input, before);
});
test("authenticated mode fails explicitly when real integration is pending, with no demo fallback", async () => {
  await assert.rejects(
    planningService.generatePlan(input, { mode: "authenticated" }),
    (e) => e.code === "unavailable",
  );
});
test("empty demo has no blocks", async () => {
  const plan = await planningService.generatePlan(
    { ...input, tasks: [], priorities: [] },
    { mode: "demo" },
  );
  assert.equal(plan.suggestedBlocks.length, 0);
});
test("rejects malformed responses, foreign tasks, duplicate IDs and over-budget plans", () => {
  const block = { id: "x", taskId: "a", title: "A", minutes: 30, reason: "Prazo" };
  for (const plan of [
    {},
    { ...emptyPlan, source: "demo" },
    { ...emptyPlan, suggestedBlocks: [{ ...block, taskId: "foreign" }] },
    { ...emptyPlan, suggestedBlocks: [block, block] },
    { ...emptyPlan, suggestedBlocks: [{ ...block, minutes: 61 }] },
  ])
    assert.throws(() => validatePlan(plan, input, "authenticated"));
});
test("invalid capacity does not call provider", async () => {
  let calls = 0;
  const service = createPlanningService({
    id: "gemini",
    async generatePlan() {
      calls++;
      return emptyPlan;
    },
  });
  for (const availableMinutes of [0, 4, 1441, 1.5, NaN])
    await assert.rejects(
      service.generatePlan({ ...input, availableMinutes }, { mode: "authenticated" }),
    );
  assert.equal(calls, 0);
});
test("timeout is recoverable even if provider never resolves", async () => {
  const service = createPlanningService(
    {
      id: "gemini",
      generatePlan() {
        return new Promise(() => {});
      },
    },
    10,
  );
  await assert.rejects(
    service.generatePlan(input, { mode: "authenticated" }),
    (e) => e.code === "timeout",
  );
});
test("abort prevents late responses from being accepted", async () => {
  const controller = new AbortController();
  const service = createPlanningService({
    id: "gemini",
    generatePlan() {
      return new Promise(() => {});
    },
  });
  const result = service.generatePlan(input, { mode: "authenticated", signal: controller.signal });
  controller.abort();
  await assert.rejects(result, (e) => e.name === "AbortError");
});

test("empty authenticated input stays unavailable without a fixture fallback", async () => {
  const empty = { ...input, tasks: [], projects: [], priorities: [], habits: [] };
  assert.deepEqual(analyzePlanningInput(empty), {
    warnings: [],
    taskMinutes: 0,
    habitMinutes: 0,
    unestimated: 0,
  });
  await assert.rejects(
    planningService.generatePlan(empty, { mode: "authenticated" }),
    (e) => e.code === "unavailable",
  );
});

test("provider failure and invalid response do not prevent a later retry", async () => {
  let calls = 0;
  const service = createPlanningService({
    id: "gemini",
    async generatePlan() {
      calls++;
      if (calls === 1) throw new Error("Provider offline");
      if (calls === 2) return { summary: "Incomplete" };
      return emptyPlan;
    },
  });
  const before = structuredClone(input);
  await assert.rejects(service.generatePlan(input, { mode: "authenticated" }));
  await assert.rejects(
    service.generatePlan(input, { mode: "authenticated" }),
    (e) => e.code === "invalid",
  );
  assert.deepEqual(await service.generatePlan(input, { mode: "authenticated" }), emptyPlan);
  assert.deepEqual(input, before);
  assert.equal(calls, 3);
});
