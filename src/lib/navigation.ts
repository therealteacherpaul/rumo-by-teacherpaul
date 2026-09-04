import { CalendarRange, CheckSquare, Gauge, ListChecks, Settings, Sun, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/today" | "/plan" | "/tasks" | "/focus" | "/review" | "/dashboard" | "/settings";
  label: string;
  icon: LucideIcon;
  /** Presente na navegação inferior do celular. */
  mobile?: boolean;
};

export const navItems: NavItem[] = [
  { to: "/today", label: "Hoje", icon: Sun, mobile: true },
  { to: "/plan", label: "Planejamento", icon: CalendarRange, mobile: true },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare, mobile: true },
  { to: "/focus", label: "Foco", icon: Timer, mobile: true },
  { to: "/review", label: "Revisão semanal", icon: ListChecks, mobile: true },
  { to: "/dashboard", label: "Dashboard", icon: Gauge, mobile: true },
  { to: "/settings", label: "Configurações", icon: Settings, mobile: true },
];

export const mobileNavItems = navItems.filter((item) => item.mobile);
