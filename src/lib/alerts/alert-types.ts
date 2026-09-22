export type AlertKind = "overdue" | "deadline" | "focus" | "habit" | "priority";
export type AlertSeverity = "info" | "attention";
export type AlertItem = {
  id: string;
  kind: AlertKind;
  title: string;
  reason: string;
  actionLabel: string;
  href: string;
  severity: AlertSeverity;
};
export type AlertPreferences = {
  enabled: boolean;
  deadlineLeadDays: number;
  dailySummaryTime: string;
  habitsEnabled: boolean;
  focusEnabled: boolean;
};
export const defaultAlertPreferences: AlertPreferences = {
  enabled: true,
  deadlineLeadDays: 2,
  dailySummaryTime: "08:00",
  habitsEnabled: true,
  focusEnabled: true,
};
export interface AlertDeliveryPort {
  notify(alert: AlertItem): Promise<void>;
}
export type BrowserNotificationPort = AlertDeliveryPort;
export type PushNotificationPort = AlertDeliveryPort;
export interface AlertExplanationPort {
  explain(alerts: readonly AlertItem[]): Promise<string>;
}
