export const DEMO_TIME_ZONE = "Asia/Tokyo";

export function formatDateLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone,
  }).format(date);
}
