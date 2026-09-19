import { createContext } from "react";

import type {
  Habit,
  HabitCheckIn,
  HabitFrequency,
  HabitStatus,
  HabitTarget,
  HabitValidation,
} from "@/lib/habit-data";

export type HabitUpdate = {
  name: string;
  frequency: HabitFrequency;
  target: HabitTarget;
  minimumTarget?: HabitTarget | undefined;
};

export type HabitContextValue = {
  loading: boolean;
  pending: boolean;
  error: string;
  reload: () => Promise<void>;
  deleteHabit: (id: string) => HabitValidation | Promise<HabitValidation>;
  habits: Habit[];
  checkIns: HabitCheckIn[];
  activeHabits: Habit[];
  createHabit: (habit: Omit<Habit, "id">) => HabitValidation | Promise<HabitValidation>;
  renameHabit: (id: string, name: string) => HabitValidation | Promise<HabitValidation>;
  updateHabit: (id: string, update: HabitUpdate) => HabitValidation | Promise<HabitValidation>;
  activateHabit: (id: string) => HabitValidation | Promise<HabitValidation>;
  deactivateHabit: (id: string) => HabitValidation | Promise<HabitValidation>;
  recordCheckIn: (checkIn: HabitCheckIn) => HabitValidation | Promise<HabitValidation>;
  clearCheckIn: (habitId: string, date: string) => HabitValidation | Promise<HabitValidation>;
  getHabitStatus: (habit: Habit, date: string) => HabitStatus;
  getHabitProgress: (habit: Habit, date: string) => number;
};

export const HabitContext = createContext<HabitContextValue | null>(null);
