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
