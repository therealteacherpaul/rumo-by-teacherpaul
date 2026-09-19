import { useMemo, useState, type ReactNode } from "react";

import { HabitContext, type HabitUpdate } from "@/components/habits/habit-context";
import {
  habitCheckInStatus,
  habitProgress,
  habits as demoHabits,
  nextCustomHabitId,
  type Habit,
  type HabitCheckIn,
  type HabitStatus,
  type HabitValidation,
  validateHabitActivation,
  validateHabitCreation,
  validateHabitDeactivation,
  validateHabitRename,
  validateHabitTarget,
  validateHabitFrequency,
  validateMinimumHabitTarget,
} from "@/lib/habit-data";

const success: HabitValidation = { valid: true };

export function DemoHabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>(() => demoHabits.map((habit) => ({ ...habit })));
  const [checkIns, setCheckIns] = useState<HabitCheckIn[]>([]);

  const value = useMemo(
    () => ({
      loading: false,
      pending: false,
      error: "",
      reload: async () => {},
      deleteHabit: (id: string) => {
        setHabits((current) => current.filter((h) => h.id !== id));
        setCheckIns((current) => current.filter((c) => c.habitId !== id));
        return success;
      },
      habits,
      checkIns,
      activeHabits: habits.filter((habit) => habit.active),
      createHabit: (habit: Omit<Habit, "id">) => {
        const validation = validateHabitCreation(habits, habit);
        if (!validation.valid) return validation;
        setHabits((current) => [...current, { ...habit, id: nextCustomHabitId(current) }]);
        return success;
      },
      renameHabit: (id: string, name: string) => {
        const validation = validateHabitRename(habits, id, name);
        if (!validation.valid) return validation;
        setHabits((current) =>
          current.map((habit) => (habit.id === id ? { ...habit, name: name.trim() } : habit)),
        );
        return success;
      },
      updateHabit: (id: string, update: HabitUpdate) => {
        const habit = habits.find((item) => item.id === id);
        if (!habit) return { valid: false, reason: "Hábito não encontrado." };
        const renameValidation = validateHabitRename(habits, id, update.name);
        if (!renameValidation.valid) return renameValidation;
        const frequencyValidation = validateHabitFrequency(update.frequency);
        if (!frequencyValidation.valid) return frequencyValidation;
        const targetValidation = validateHabitTarget(update.target);
        if (!targetValidation.valid) return targetValidation;
        const minimumValidation = validateMinimumHabitTarget(update.minimumTarget, update.target);
        if (!minimumValidation.valid) return minimumValidation;
        setHabits((current) =>
          current.map((item) => (item.id === id ? { ...item, ...update } : item)),
        );
        return success;
      },
      activateHabit: (id: string) => {
        const validation = validateHabitActivation(habits, id);
        if (!validation.valid) return validation;
        setHabits((current) =>
          current.map((habit) => (habit.id === id ? { ...habit, active: true } : habit)),
        );
        return success;
      },
      deactivateHabit: (id: string) => {
        const validation = validateHabitDeactivation(habits, id);
        if (!validation.valid) return validation;
        setHabits((current) =>
          current.map((habit) => (habit.id === id ? { ...habit, active: false } : habit)),
        );
        return success;
      },
      recordCheckIn: (checkIn: HabitCheckIn) => {
        setCheckIns((current) => {
          const exists = current.some(
            (item) => item.habitId === checkIn.habitId && item.date === checkIn.date,
          );
          return exists
            ? current.map((item) =>
                item.habitId === checkIn.habitId && item.date === checkIn.date ? checkIn : item,
              )
            : [...current, checkIn];
        });
        return success;
      },
      clearCheckIn: (habitId: string, date: string) => {
        setCheckIns((current) =>
          current.filter((item) => !(item.habitId === habitId && item.date === date)),
        );
        return success;
      },
      getHabitStatus: (habit: Habit, date: string): HabitStatus =>
        habitCheckInStatus(
          habit,
          checkIns.find((item) => item.habitId === habit.id && item.date === date),
        ),
      getHabitProgress: (habit: Habit, date: string) =>
        habitProgress(
          checkIns.find((item) => item.habitId === habit.id && item.date === date)?.value ?? 0,
          habit.target.target,
        ),
    }),
    [checkIns, habits],
  );

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}
