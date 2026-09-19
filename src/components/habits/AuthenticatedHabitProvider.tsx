import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { HabitContext, type HabitContextValue } from "./habit-context";
import { habitRepository, type HabitRepository } from "@/lib/habit-repository";
import {
  habitCheckInStatus,
  habitProgress,
  validateHabitCreation,
  validateHabitRename,
  validateHabitActivation,
  validateHabitFrequency,
  validateHabitTarget,
  validateMinimumHabitTarget,
  type Habit,
  type HabitCheckIn,
  type HabitValidation,
} from "@/lib/habit-data";

export function AuthenticatedHabitProvider({
  userId,
  children,
  repository = habitRepository,
}: {
  userId: string;
  children: ReactNode;
  repository?: HabitRepository;
}) {
  // Also protects direct consumers/tests that change userId without a key.
  return (
    <UserHabits key={userId} userId={userId} repository={repository}>
      {children}
    </UserHabits>
  );
}
function UserHabits({
  userId,
  children,
  repository,
}: {
  userId: string;
  children: ReactNode;
  repository: HabitRepository;
}) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkIns, setCheckIns] = useState<HabitCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const alive = useRef(false);
  const busy = useRef(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const run = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const next = await repository.load(userId);
      if (alive.current && run === generation.current) {
        setHabits(next.habits);
        setCheckIns(next.checkIns);
      }
    } catch {
      if (alive.current && run === generation.current) {
        setHabits([]);
        setCheckIns([]);
        setError(
          "Não foi possível carregar seus hábitos. Tente novamente. A configuração do banco pode estar pendente.",
        );
      }
    } finally {
      if (alive.current && run === generation.current) setLoading(false);
    }
  }, [repository, userId]);
  useEffect(() => {
    alive.current = true;
    void reload();
    return () => {
      alive.current = false;
    };
  }, [reload]);
  async function mutate(action: () => Promise<void>): Promise<HabitValidation> {
    if (!alive.current || busy.current || loading || error)
      return { valid: false, reason: "Aguarde o carregamento ou tente novamente." };
    busy.current = true;
    setPending(true);
    try {
      await action();
      if (!alive.current) return { valid: false, reason: "Sessão alterada." };
      const next = await repository.load(userId);
      if (!alive.current) return { valid: false, reason: "Sessão alterada." };
      setHabits(next.habits);
      setCheckIns(next.checkIns);
      return { valid: true };
    } catch {
      if (alive.current)
        setError(
          "Não foi possível confirmar a operação. Recarregue seus hábitos antes de continuar.",
        );
      return {
        valid: false,
        reason:
          "Não foi possível confirmar a operação. Recarregue os hábitos antes de tentar novamente.",
      };
    } finally {
      busy.current = false;
      if (alive.current) setPending(false);
    }
  }
  const value: HabitContextValue = {
    habits,
    checkIns,
    activeHabits: habits.filter((h) => h.active),
    loading,
    pending,
    error,
    reload,
    createHabit: (habit) => {
      const result = validateHabitCreation(habits, { ...habit, source: "user" });
      return result.valid ? mutate(() => repository.save({ ...habit, source: "user" })) : result;
    },
    renameHabit: (id, name) => {
      const result = validateHabitRename(habits, id, name);
      const habit = habits.find((h) => h.id === id);
      return result.valid && habit ? mutate(() => repository.save({ ...habit, name }, id)) : result;
    },
    updateHabit: (id, update) => {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return { valid: false, reason: "Hábito não encontrado." };
      for (const result of [
        validateHabitRename(habits, id, update.name),
        validateHabitFrequency(update.frequency),
        validateHabitTarget(update.target),
        validateMinimumHabitTarget(update.minimumTarget, update.target),
      ])
        if (!result.valid) return result;
      return mutate(() =>
        repository.save({ ...habit, ...update, minimumTarget: update.minimumTarget }, id),
      );
    },
    activateHabit: (id) => {
      const result = validateHabitActivation(habits, id);
      return result.valid ? mutate(() => repository.setActive(id, true)) : result;
    },
    deactivateHabit: (id) => mutate(() => repository.setActive(id, false)),
    deleteHabit: (id) => mutate(() => repository.remove(id)),
    recordCheckIn: (checkIn) => {
      if (!Number.isFinite(checkIn.value) || checkIn.value < 0)
        return { valid: false, reason: "Informe um valor válido." };
      return mutate(() => repository.record(checkIn));
    },
    clearCheckIn: (id, date) => mutate(() => repository.clear(id, date)),
    getHabitStatus: (habit, date) =>
      habitCheckInStatus(
        habit,
        checkIns.find((c) => c.habitId === habit.id && c.date === date),
      ),
    getHabitProgress: (habit, date) =>
      habitProgress(
        checkIns.find((c) => c.habitId === habit.id && c.date === date)?.value ?? 0,
        habit.target.target,
      ),
  };
  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}
