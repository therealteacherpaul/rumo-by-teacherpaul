import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("focus migration protects ownership and duration invariants", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260921120000_focus_sessions.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /create table public\.focus_sessions/);
  assert.match(sql, /check \(actual_minutes >= 0/);
  assert.match(sql, /check \(ended_at is null or ended_at >= started_at\)/);
  assert.match(sql, /status in \('completed','ended','cancelled'\)/);
  assert.match(sql, /foreign key \(user_id, task_id\) references public\.tasks\(user_id, id\)/);
  assert.match(
    sql,
    /for update to authenticated using \(\(select auth\.uid\(\)\) = user_id\) with check/,
  );
});
