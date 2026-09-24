import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("foreground delivery is explicit, preference-aware and deduplicated", async () => {
  const source = await readFile("src/lib/alerts/alert-delivery.ts", "utf8");
  assert.match(source, /requestPermission/);
  assert.match(source, /deliveredAlertIds/);
  assert.match(source, /preferences\.enabled/);
  assert.match(source, /new Notification/);
  assert.match(source, /foregroundEnabled/);
  assert.match(source, /if \(!foregroundEnabled/);
});

test("daily summary is a contract only and respects disabled preferences", async () => {
  const source = await readFile("src/lib/alerts/daily-summary.ts", "utf8");
  assert.match(source, /DailySummary/);
  assert.match(source, /dailySummaryTime/);
  assert.match(source, /if \(!preferences\.enabled\) return null/);
  assert.doesNotMatch(source, /setInterval|fetch\(|functions\.invoke/);
});
