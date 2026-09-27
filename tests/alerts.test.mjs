import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("alert rules define deterministic, deduplicated keys and demo-safe links", async () => {
  const source = await readFile(
    new URL("../src/lib/alerts/alert-rules.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /overdue:/);
  assert.match(source, /deadline:/);
  assert.match(source, /habit:.*today/);
  assert.match(source, /focus:/);
  assert.match(source, /priority:/);
  assert.match(source, /status === "cancelled"/);
  assert.match(source, /seenFocus/);
  const ui = await readFile(
    new URL("../src/components/alerts/AlertCenter.tsx", import.meta.url),
    "utf8",
  );
  assert.match(ui, /search=\{demo \? \{ mode: "demo" \} : \{\}\}/);
  assert.match(ui, /dismissed/);
  assert.match(ui, /ALERT_PAGE_SIZE = 3/);
  assert.match(ui, /visible\.slice\(0, ALERT_PAGE_SIZE\)/);
  assert.match(ui, /Mostrando \{shown\.length\} de \{visible\.length\}/);
  assert.doesNotMatch(ui, /Ativar notificações nesta aba/);
  assert.doesNotMatch(ui, /type="checkbox"/);
  const settings = await readFile(
    new URL("../src/components/alerts/AlertSettings.tsx", import.meta.url),
    "utf8",
  );
  assert.match(settings, /Ativar notificações nesta aba/);
  assert.match(settings, /Desativar notificações nesta aba/);
  assert.match(settings, /notificationBusy/);
  assert.match(settings, /Ativar alertas/);
  assert.match(settings, /Alertas de hábitos/);
  assert.match(settings, /Alertas de foco/);
});


test("alert preferences are independent defaults for each user instance", async () => {
  const source = await readFile(
    new URL("../src/lib/alerts/alert-types.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /enabled: true/);
  assert.match(source, /deadlineLeadDays: 2/);
  assert.match(source, /habitsEnabled: true/);
  assert.match(source, /focusEnabled: true/);
});
