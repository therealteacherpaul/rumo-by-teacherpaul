import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { defaultAlertPreferences, type AlertPreferences } from "./alert-types";

export type AlertPreferencesRow = Tables<"alert_preferences">;
export async function loadAlertPreferences(userId: string): Promise<AlertPreferences> {
  const result = await supabase
    .from("alert_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data
    ? {
        enabled: result.data.enabled,
        habitsEnabled: result.data.habits_enabled,
        focusEnabled: result.data.focus_enabled,
        deadlineLeadDays: result.data.deadline_lead_days,
        dailySummaryTime: result.data.daily_summary_time.slice(0, 5),
      }
    : defaultAlertPreferences;
}
export async function saveAlertPreferences(
  userId: string,
  preferences: AlertPreferences,
): Promise<void> {
  const session = await supabase.auth.getUser();
  if (session.error || session.data.user?.id !== userId)
    throw session.error ?? new Error("Sessão inválida");
  const payload: TablesInsert<"alert_preferences"> = {
    enabled: preferences.enabled,
    habits_enabled: preferences.habitsEnabled,
    focus_enabled: preferences.focusEnabled,
    deadline_lead_days: preferences.deadlineLeadDays,
    daily_summary_time: preferences.dailySummaryTime,
  };
  const result = await supabase
    .from("alert_preferences")
    .upsert(payload, { onConflict: "user_id" });
  if (result.error) throw result.error;
}
