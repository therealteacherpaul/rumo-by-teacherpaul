import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import type { Habit, HabitCheckIn, HabitFrequency, HabitTarget } from "./habit-data";
import { pastOccurrenceDates } from "./habit-data";

export interface HabitRepository {
  load(userId: string): Promise<{ habits: Habit[]; checkIns: HabitCheckIn[] }>;
  save(habit: Omit<Habit, "id">, id?: string): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
  remove(id: string): Promise<void>;
  record(checkIn: HabitCheckIn): Promise<void>;
  clear(habitId: string, date: string): Promise<void>;
}
function mapHabit(row: Tables<"user_habits">): Habit {
  const frequency: HabitFrequency =
    row.frequency_type === "daily"
      ? { type: "daily" }
      : {
          type: row.frequency_type as "everyDays" | "everyHours",
          interval: row.frequency_interval!,
        };
  const target: HabitTarget =
    row.target_type === "quantity"
      ? { type: "quantity", target: row.target_value, unit: row.target_unit! }
      : { type: row.target_type as "occurrence" | "durationMin", target: row.target_value };
  return {
    id: row.id,
    name: row.name,
    source: row.source as Habit["source"],
    active: row.active,
    startDate: row.start_date,
    frequency,
    target,
    ...(row.minimum_value === null
      ? {}
      : { minimumTarget: { ...target, target: row.minimum_value } }),
  };
}
function payload(habit: Omit<Habit, "id">): TablesInsert<"user_habits"> {
  return {
    name: habit.name.trim(),
    active: habit.active,
    frequency_type: habit.frequency.type,
    frequency_interval: habit.frequency.type === "daily" ? null : habit.frequency.interval,
    target_type: habit.target.type,
    target_value: habit.target.target,
    target_unit: habit.target.type === "quantity" ? habit.target.unit.trim() : null,
    minimum_value: habit.minimumTarget?.target ?? null,
    start_date: habit.startDate,
  };
}
async function checked(result: { error: unknown }) {
  if (result.error) throw new Error("Não foi possível salvar seus hábitos. Tente novamente.");
}
export const habitRepository: HabitRepository = {
  async load(userId) {
    await checked(await supabase.rpc("initialize_user_habits"));
    const habitsResult = await supabase
      .from("user_habits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at")
      .order("id");
    await checked(habitsResult);
    const habits = (habitsResult.data ?? []).map(mapHabit);
    const checkIns: HabitCheckIn[] = [];
    // Paginate historical daily records rather than silently truncating at API row limit.
    for (let offset = 0; ; offset += 500) {
      const result = await supabase
        .from("habit_check_ins")
        .select("*")
        .eq("user_id", userId)
        .order("date")
        .order("habit_id")
        .range(offset, offset + 499);
      await checked(result);
      const rows = result.data ?? [];
      checkIns.push(
        ...rows.map((row) => ({
          habitId: row.habit_id,
          date: row.date,
          value: row.value,
          mode: row.mode as HabitCheckIn["mode"],
          completed:
            row.value >= (habits.find((h) => h.id === row.habit_id)?.target.target ?? Infinity),
        })),
      );
      if (rows.length < 500) break;
    }
    // Dias encerrados sem registro viram "não feito" (valor 0). Nunca sobrescreve registros.
    const today = new Date().toLocaleDateString("en-CA");
    const missing: TablesInsert<"habit_check_ins">[] = [];
    for (const habit of habits.filter((h) => h.active)) {
      for (const date of pastOccurrenceDates(habit, today)) {
        if (!checkIns.some((c) => c.habitId === habit.id && c.date === date))
          missing.push({ habit_id: habit.id, date, value: 0, mode: "principal" });
      }
    }
    if (missing.length) {
      const result = await supabase
        .from("habit_check_ins")
        .upsert(missing, { onConflict: "user_id,habit_id,date", ignoreDuplicates: true });
      if (!result.error)
        checkIns.push(
          ...missing.map((m) => ({
            habitId: m.habit_id,
            date: m.date,
            value: 0,
            mode: "principal" as const,
            completed: false,
          })),
        );
    }
    return { habits, checkIns };
  },
  async save(habit, id) {
    // Ownership is supplied by auth.uid() in SQL, never trusted from form input.
    await checked(
      id
        ? await supabase
            .from("user_habits")
            .update(payload(habit))
            .eq("id", id)
            .select("id")
            .single()
        : await supabase.from("user_habits").insert(payload(habit)),
    );
  },
  async setActive(id, active) {
    await checked(
      await supabase.from("user_habits").update({ active }).eq("id", id).select("id").single(),
    );
  },
  async remove(id) {
    await checked(await supabase.from("user_habits").delete().eq("id", id).select("id").single());
  },
  async record(checkIn) {
    await checked(
      await supabase.from("habit_check_ins").upsert(
        {
          habit_id: checkIn.habitId,
          date: checkIn.date,
          value: checkIn.value,
          mode: checkIn.mode,
        },
        { onConflict: "user_id,habit_id,date" },
      ),
    );
  },
  async clear(habitId, date) {
    await checked(
      await supabase.from("habit_check_ins").delete().eq("habit_id", habitId).eq("date", date),
    );
  },
};
