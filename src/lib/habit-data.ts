/**
 * Fundação local do Habit Tracker (demonstração).
 *
 * Este módulo não persiste dados nem depende de data/hora implícita. As
 * funções recebem as datas necessárias para que o cálculo continue previsível
 * no SSR, no cliente e em testes futuros.
 */

export type HabitSource = "system" | "user";

export type HabitFrequency =
  | { type: "daily" }
  | { type: "everyDays"; interval: number }
  | { type: "everyHours"; interval: number };

export type HabitTarget =
  | { type: "occurrence"; target: number }
  | { type: "durationMin"; target: number }
  | { type: "quantity"; target: number; unit: string };

export type Habit = {
  id: string;
  name: string;
  source: HabitSource;
  active: boolean;
  frequency: HabitFrequency;
  target: HabitTarget;
  minimumTarget?: HabitTarget | undefined;
  startDate: string;
};

export type HabitCheckIn = {
  habitId: string;
  date: string;
  value: number;
  completed: boolean;
  mode: "principal" | "leve";
};

export type HabitStatus = "nao_registrado" | "em_progresso" | "feito" | "modo_leve";

export type HabitValidation = { valid: true } | { valid: false; reason: string };

export const HABIT_LIMITS = {
  total: 20,
  active: 12,
  userCreated: 10,
} as const;

const FREQUENCY_LIMITS = {
  everyDays: { min: 1, max: 365 },
  everyHours: { min: 1, max: 24 },
} as const;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const habits: Habit[] = [
  {
    id: "habit-water",
    name: "Beber água",
    source: "system",
    active: true,
    frequency: { type: "everyHours", interval: 2 },
    target: { type: "quantity", target: 8, unit: "copos" },
    minimumTarget: { type: "quantity", target: 4, unit: "copos" },
    startDate: "2026-09-01",
  },
  {
    id: "habit-meditation",
    name: "Meditar",
    source: "system",
    active: true,
    frequency: { type: "daily" },
    target: { type: "durationMin", target: 10 },
    minimumTarget: { type: "durationMin", target: 3 },
    startDate: "2026-09-01",
  },
  {
    id: "habit-sleep",
    name: "Dormir no horário",
    source: "system",
    active: true,
    frequency: { type: "daily" },
    target: { type: "occurrence", target: 1 },
    startDate: "2026-09-01",
  },
  {
    id: "habit-prayer",
    name: "Orar",
    source: "system",
    active: true,
    frequency: { type: "daily" },
    target: { type: "occurrence", target: 1 },
    minimumTarget: { type: "occurrence", target: 1 },
    startDate: "2026-09-01",
  },
  {
    id: "habit-exercise",
    name: "Exercitar-se",
    source: "system",
    active: true,
    frequency: { type: "everyDays", interval: 2 },
    target: { type: "durationMin", target: 30 },
    minimumTarget: { type: "durationMin", target: 10 },
    startDate: "2026-09-01",
  },
  {
    id: "habit-reading",
    name: "Ler",
    source: "system",
    active: true,
    frequency: { type: "daily" },
    target: { type: "durationMin", target: 20 },
    minimumTarget: { type: "durationMin", target: 5 },
    startDate: "2026-09-01",
  },
  {
    id: "habit-stretching",
    name: "Alongar",
    source: "system",
    active: true,
    frequency: { type: "everyDays", interval: 2 },
    target: { type: "durationMin", target: 10 },
    minimumTarget: { type: "durationMin", target: 3 },
    startDate: "2026-09-01",
  },
  {
    id: "habit-planning",
    name: "Planejar o dia",
    source: "system",
    active: true,
    frequency: { type: "daily" },
    target: { type: "durationMin", target: 10 },
    minimumTarget: { type: "durationMin", target: 2 },
    startDate: "2026-09-01",
  },
];

const normalizedHabitName = (name: string) => name.trim().toLocaleLowerCase();

const isFinitePositive = (value: number) => Number.isFinite(value) && value > 0;

export const isCustomHabitId = (id: string): id is `custom-habit-${string}` =>
  id.startsWith("custom-habit-");

export const habitCounts = (items: readonly Habit[]) => ({
  total: items.length,
  active: items.filter((habit) => habit.active).length,
  userCreated: items.filter((habit) => habit.source === "user").length,
});

export const hasDuplicateHabitName = (
  items: readonly Habit[],
  name: string,
  excludedId?: string,
) => {
  const normalizedName = normalizedHabitName(name);
  return items.some(
    (habit) => habit.id !== excludedId && normalizedHabitName(habit.name) === normalizedName,
  );
};

export function validateHabitFrequency(frequency: HabitFrequency): HabitValidation {
  if (frequency.type === "daily") return { valid: true };
  const limits = FREQUENCY_LIMITS[frequency.type];
  if (!Number.isInteger(frequency.interval) || frequency.interval < limits.min) {
    return { valid: false, reason: "O intervalo do hábito deve ser um número positivo." };
  }
  if (frequency.interval > limits.max) {
    return { valid: false, reason: "O intervalo do hábito excede o limite razoável." };
  }
  return { valid: true };
}

export function validateHabitTarget(target: HabitTarget): HabitValidation {
  if (!isFinitePositive(target.target)) {
    return { valid: false, reason: "A meta principal deve ser um número positivo." };
  }
  if (target.type === "quantity" && !target.unit.trim()) {
    return { valid: false, reason: "A unidade da meta é obrigatória." };
  }
  return { valid: true };
}

export function validateMinimumHabitTarget(
  target: HabitTarget | undefined,
  mainTarget: HabitTarget,
): HabitValidation {
  if (!target) return { valid: true };
  const targetValidation = validateHabitTarget(target);
  if (!targetValidation.valid) return targetValidation;
  const comparable =
    target.type === mainTarget.type &&
    (target.type !== "quantity" ||
      mainTarget.type !== "quantity" ||
      target.unit.trim() === mainTarget.unit.trim());
  if (comparable && target.target > mainTarget.target) {
    return { valid: false, reason: "A meta mínima não pode ser maior que a meta principal." };
  }
  return { valid: true };
}

export function validateHabitCreation(
  items: readonly Habit[],
  habit: Pick<Habit, "name" | "source" | "active" | "frequency" | "target" | "minimumTarget">,
): HabitValidation {
  if (!habit.name.trim()) return { valid: false, reason: "O nome do hábito é obrigatório." };
  if (hasDuplicateHabitName(items, habit.name)) {
    return { valid: false, reason: "Já existe um hábito com esse nome." };
  }
  if (items.length >= HABIT_LIMITS.total) {
    return { valid: false, reason: "O limite total de hábitos foi atingido." };
  }
  if (habit.source === "user" && habitCounts(items).userCreated >= HABIT_LIMITS.userCreated) {
    return { valid: false, reason: "O limite de hábitos criados pelo usuário foi atingido." };
  }
  if (habit.active && habitCounts(items).active >= HABIT_LIMITS.active) {
    return { valid: false, reason: "O limite de hábitos ativos foi atingido." };
  }
  const frequencyValidation = validateHabitFrequency(habit.frequency);
  if (!frequencyValidation.valid) return frequencyValidation;
  const targetValidation = validateHabitTarget(habit.target);
  if (!targetValidation.valid) return targetValidation;
  return validateMinimumHabitTarget(habit.minimumTarget, habit.target);
}

export function validateHabitRename(
  items: readonly Habit[],
  id: string,
  name: string,
): HabitValidation {
  if (!name.trim()) return { valid: false, reason: "O nome do hábito é obrigatório." };
  if (!items.some((habit) => habit.id === id)) {
    return { valid: false, reason: "Hábito não encontrado." };
  }
  if (hasDuplicateHabitName(items, name, id)) {
    return { valid: false, reason: "Já existe um hábito com esse nome." };
  }
  return { valid: true };
}

export function validateHabitActivation(items: readonly Habit[], id: string): HabitValidation {
  const habit = items.find((item) => item.id === id);
  if (!habit) return { valid: false, reason: "Hábito não encontrado." };
  if (habit.active) return { valid: true };
  if (habitCounts(items).active >= HABIT_LIMITS.active) {
    return { valid: false, reason: "O limite de hábitos ativos foi atingido." };
  }
  return { valid: true };
}

export function validateHabitDeactivation(items: readonly Habit[], id: string): HabitValidation {
  return items.some((habit) => habit.id === id)
    ? { valid: true }
    : { valid: false, reason: "Hábito não encontrado." };
}

export function validateHabitDate(date: string): HabitValidation {
  if (!ISO_DATE_PATTERN.test(date)) {
    return { valid: false, reason: "A data deve usar o formato YYYY-MM-DD." };
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === date
    ? { valid: true }
    : { valid: false, reason: "A data informada não é válida." };
}

export function nextCustomHabitId(items: readonly Habit[]): `custom-habit-${number}` {
  const next =
    items.reduce((max, habit) => {
      const match = habit.id.match(/^custom-habit-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;
  return `custom-habit-${next}`;
}

export function habitOccursOnDate(habit: Habit, date: string): boolean {
  if (!validateHabitDate(date).valid || !validateHabitDate(habit.startDate).valid) return false;
  if (date < habit.startDate) return false;
  if (habit.frequency.type === "daily" || habit.frequency.type === "everyHours") return true;
  const start = Date.parse(`${habit.startDate}T00:00:00Z`);
  const current = Date.parse(`${date}T00:00:00Z`);
  const days = Math.floor((current - start) / 86_400_000);
  return days % habit.frequency.interval === 0;
}

export function habitProgress(value: number, target: number): number {
  if (!isFinitePositive(target) || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round((value / target) * 100)));
}

export function habitCheckInStatus(habit: Habit, checkIn?: HabitCheckIn): HabitStatus {
  if (!checkIn || !Number.isFinite(checkIn.value) || checkIn.value <= 0) return "nao_registrado";
  if (checkIn.value >= habit.target.target) return "feito";
  if (habit.minimumTarget && checkIn.value >= habit.minimumTarget.target) return "modo_leve";
  return "em_progresso";
}
