import type { AlertItem, AlertPreferences } from "./alert-types";

export type DailySummary = {
  date: string;
  scheduledTime: string;
  title: string;
  body: string;
  alertIds: string[];
};

export function buildDailySummary(
  alerts: readonly AlertItem[],
  preferences: AlertPreferences,
  date = new Date().toISOString().slice(0, 10),
): DailySummary | null {
  if (!preferences.enabled) return null;
  return {
    date,
    scheduledTime: preferences.dailySummaryTime,
    title: "Resumo do seu dia",
    body: alerts.length
      ? `${alerts.length} alerta${alerts.length === 1 ? "" : "s"} para revisar.`
      : "Nenhum alerta pendente no momento.",
    alertIds: alerts.map((alert) => alert.id),
  };
}
