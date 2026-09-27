import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type FocusSession = Tables<"focus_sessions">;
export type FocusSessionInput = Omit<TablesInsert<"focus_sessions">, "user_id">;

export async function loadFocusSessions(userId: string): Promise<FocusSession[]> {
  const result = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(50);
  if (result.error) throw result.error;
  return result.data ?? [];
}

export async function saveFocusSession(input: FocusSessionInput): Promise<FocusSession> {
  const result = await supabase.from("focus_sessions").insert(input).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}

function startOfDayIso(reference: string) {
  const day = new Date(reference);
  day.setHours(0, 0, 0, 0);
  return day.toISOString();
}

/**
 * Keeps a single focus entry per task per day: adds the new minutes to the open
 * entry instead of creating another row. A finished ("completed") entry is never
 * reopened, so a brand new block after one starts its own entry.
 */
export async function accumulateFocusSession(
  userId: string,
  input: FocusSessionInput,
): Promise<{ session: FocusSession; replacedId: string | null }> {
  if (input.task_id) {
    const existing = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("task_id", input.task_id)
      .eq("status", "ended")
      .gte("started_at", startOfDayIso(input.started_at))
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error) throw existing.error;
    const current = existing.data;
    if (current) {
      const updated = await supabase
        .from("focus_sessions")
        .update({
          actual_minutes: Math.min(1440, current.actual_minutes + (input.actual_minutes ?? 0)),
          planned_minutes: Math.max(current.planned_minutes, input.planned_minutes),
          ended_at: input.ended_at ?? new Date().toISOString(),
          status: input.status,
        })
        .eq("user_id", userId)
        .eq("id", current.id)
        .select("*")
        .single();
      if (updated.error) throw updated.error;
      return { session: updated.data, replacedId: current.id };
    }
  }
  return { session: await saveFocusSession(input), replacedId: null };
}
