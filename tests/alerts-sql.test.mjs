import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260922130000_alert_preferences.sql", "utf8");
const repository = readFileSync("src/lib/alerts/alert-preferences-repository.ts", "utf8");

test("alert preferences migration isolates every operation by auth.uid", () => {
  assert.match(migration, /create table public\.alert_preferences/);
  assert.match(migration, /user_id uuid primary key default auth\.uid\(\)/);
  assert.match(migration, /enable row level security/);
  for (const operation of ["select", "insert", "update", "delete"]) {
    assert.match(migration, new RegExp(`policy .*${operation}.*alert_preferences`, "i"));
  }
  assert.match(
    migration,
    /for update .*using \(\(select auth\.uid\(\)\) = user_id\).*with check \(\(select auth\.uid\(\)\) = user_id\)/is,
  );
  assert.match(migration, /deadline_lead_days integer not null default 2 check/);
  assert.match(migration, /daily_summary_time time not null default '08:00'/);
  assert.match(migration, /revoke all on public\.alert_preferences from public, anon/);
});

test("preference writes revalidate the session and use idempotent upsert", () => {
  assert.match(repository, /supabase\.auth\.getUser\(\)/);
  assert.match(repository, /session\.data\.user\?\.id !== userId/);
  assert.match(repository, /\.upsert\(payload, \{ onConflict: "user_id" \}\)/);
  assert.doesNotMatch(repository, /service_role/i);
});
