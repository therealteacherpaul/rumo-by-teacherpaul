import { supabase } from "@/integrations/supabase/client";
import type { TaskData } from "./task-data";

// Read in pages so the Data API's row cap cannot silently hide older records.
async function readAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  signal: AbortSignal,
): Promise<T[]> {
  const rows: T[] = [];
  const size = 100;
  for (let from = 0; ; from += size) {
    signal.throwIfAborted();
    const result = await page(from, from + size - 1);
    signal.throwIfAborted();
    if (result.error) throw result.error;
    if (!result.data) throw new Error("Missing query result");
    rows.push(...result.data);
    if (result.data.length < size) return rows;
  }
}

export async function loadTaskData(userId: string, signal: AbortSignal): Promise<TaskData> {
  const [categories, projects, tasks] = await Promise.all([
    readAll(
      (from, to) =>
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", userId)
          .order("created_at")
          .order("id")
          .range(from, to)
          .abortSignal(signal),
      signal,
    ),
    readAll(
      (from, to) =>
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", userId)
          .order("created_at")
          .order("id")
          .range(from, to)
          .abortSignal(signal),
      signal,
    ),
    readAll(
      (from, to) =>
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .order("id")
          .range(from, to)
          .abortSignal(signal),
      signal,
    ),
  ]);
  return { categories, projects, tasks };
}
