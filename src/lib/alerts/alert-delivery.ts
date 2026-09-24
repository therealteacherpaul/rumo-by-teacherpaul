import type { AlertItem, AlertPreferences } from "./alert-types";

const deliveredAlertIds = new Set<string>();

export type BrowserNotificationStatus = "unsupported" | "default" | "granted" | "denied";

export function browserNotificationStatus(): BrowserNotificationStatus {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationStatus> {
  if (browserNotificationStatus() === "unsupported") return "unsupported";
  return Notification.requestPermission();
}

export function deliverForegroundAlerts(
  alerts: readonly AlertItem[],
  preferences: AlertPreferences,
  foregroundEnabled = true,
): number {
  if (!foregroundEnabled || !preferences.enabled || browserNotificationStatus() !== "granted")
    return 0;
  let delivered = 0;
  for (const alert of alerts) {
    if (deliveredAlertIds.has(alert.id)) continue;
    new Notification(alert.title, { body: alert.reason, tag: alert.id });
    deliveredAlertIds.add(alert.id);
    delivered += 1;
  }
  return delivered;
}

export function resetDeliveredAlertIdsForTests(): void {
  deliveredAlertIds.clear();
}
