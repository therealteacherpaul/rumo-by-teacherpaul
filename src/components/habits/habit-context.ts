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
  habits: Habit[];
  checkIns: HabitCheckIn[];
  activeHabits: Habit[];
  createHabit: (habit: Omit<Habit, "id">) => HabitValidation;
  renameHabit: (id: string, name: string) => HabitValidation;
  updateHabit: (id: string, update: HabitUpdate) => HabitValidation;
  activateHabit: (id: string) => HabitValidation;
  deactivateHabit: (id: string) => HabitValidation;
  recordCheckIn: (checkIn: HabitCheckIn) => void;
  clearCheckIn: (habitId: string, date: string) => void;
  getHabitStatus: (habit: Habit, date: string) => HabitStatus;
  getHabitProgress: (habit: Habit, date: string) => number;
};

export const HabitContext = createContext<HabitContextValue | null>(null);
