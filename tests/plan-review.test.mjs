import test from "node:test";
import assert from "node:assert/strict";
import {
  currentWeek,
  habitReview,
  projectProgress,
  reviewSummary,
  taskBucket,
} from "../src/lib/plan-review.ts";

const task = (overrides = {}) => ({
  id: "t1",
  title: "Tarefa",
  project_id: "p1",
  status: "A fazer",
  due_date: null,
  archived: false,
  updated_at: "2026-09-20",
  ...overrides,
});
test("Plan agrupa prazos em atraso, próximos e sem prazo", () => {
  assert.equal(taskBucket(task({ due_date: "2026-09-19" }), "2026-09-20"), "atrasadas");
  assert.equal(taskBucket(task({ due_date: "2026-09-25" }), "2026-09-20"), "proximas");
  assert.equal(taskBucket(task(), "2026-09-20"), "semPrazo");
});
test("progresso de projeto conta somente tarefas não arquivadas", () => {
  assert.deepEqual(
    projectProgress(
      [task({ status: "Concluída" }), task({ id: "t2" }), task({ id: "t3", archived: true })],
      "p1",
    ),
    { total: 2, done: 1, percent: 50 },
  );
});
test("Review calcula semana, conclusão de tarefas e hábitos", () => {
  assert.deepEqual(currentWeek("2026-09-20"), { start: "2026-09-14", end: "2026-09-20" });
  const habits = [{ id: "h1", active: true }];
  const checks = [{ habitId: "h1", date: "2026-09-20", completed: true }];
  assert.deepEqual(habitReview(habits, checks, "2026-09-14", "2026-09-20"), {
    completed: 1,
    expected: 7,
    percent: 14,
    records: checks,
  });
  const result = reviewSummary(
    [
      task({ status: "Concluída", updated_at: "2026-09-19" }),
      task({ id: "t2", due_date: "2026-09-10" }),
      task({ id: "t3" }),
    ],
    [{ id: "p1", name: "Projeto", active: true }],
    habits,
    checks,
    "2026-09-20",
  );
  assert.equal(result.completed.length, 1);
  assert.equal(result.overdue.length, 1);
  assert.equal(result.noDue.length, 1);
  assert.ok(result.alerts.some((alert) => alert.includes("atrasada")));
});
