import { pluralize } from "@/lib/pluralize";
import { Check, ExternalLink, Minus, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppDataMode } from "@/hooks/use-app-data-mode";
import { useHabits } from "@/hooks/use-habits";
import {
  habitIncrementStep,
  habitOccursOnDate,
  type Habit,
  type HabitFrequency,
  type HabitStatus,
  type HabitTarget,
} from "@/lib/habit-data";

const DEMO_DATE = "2026-09-08";
const MAX_QUICK_HABITS = 4;
const statusLabels: Record<HabitStatus, string> = {
  nao_registrado: "Não registrado",
  em_progresso: "Em progresso",
  feito: "Feito",
  modo_leve: "Modo leve",
  nao_feito: "Não feito",
};
const statusVariants: Record<HabitStatus, "default" | "secondary" | "outline"> = {
  nao_registrado: "outline",
  em_progresso: "secondary",
  feito: "default",
  modo_leve: "secondary",
  nao_feito: "outline",
};

function formatFrequency(frequency: HabitFrequency) {
  if (frequency.type === "daily") return "Diário";
  if (frequency.type === "everyDays") return `A cada ${frequency.interval} dias`;
  return `A cada ${frequency.interval} horas`;
}

function formatTarget(target: HabitTarget) {
  if (target.type === "durationMin") return `${target.target} min`;
  if (target.type === "quantity") return `${target.target} ${target.unit}`;
  return `${target.target} ocorrência${target.target === 1 ? "" : "s"}`;
}

function targetValue(target: HabitTarget | undefined) {
  return target?.target ?? 1;
}

export function HabitTodaySummary() {
  const mode = useAppDataMode();
  const date = mode === "demo" ? DEMO_DATE : new Date().toLocaleDateString("en-CA");
  const {
    loading,
    pending: saving,
    error,
    reload,
    activeHabits,
    checkIns,
    getHabitProgress,
    getHabitStatus,
    recordCheckIn,
    clearCheckIn,
  } = useHabits();
  const [message, setMessage] = useState("");
  const habits = activeHabits.filter((habit) => habitOccursOnDate(habit, date));
  const statuses = habits.map((habit) => getHabitStatus(habit, date));
  const completed = statuses.filter((status) => status === "feito").length;
  const light = statuses.filter((status) => status === "modo_leve").length;
  const pending = habits.length - completed - light;
  const overallProgress = habits.length
    ? Math.round(
        habits.reduce((total, habit) => total + getHabitProgress(habit, date), 0) / habits.length,
      )
    : 0;

  const updateCheckIn = async (habit: Habit, checkInMode: "principal" | "leve") => {
    const result = await recordCheckIn({
      habitId: habit.id,
      date: date,
      value: targetValue(checkInMode === "principal" ? habit.target : habit.minimumTarget),
      completed: checkInMode === "principal",
      mode: checkInMode,
    });
    setMessage(
      result.valid
        ? `“${habit.name}” atualizado${mode === "demo" ? " nesta demonstração" : " na sua conta"}.`
        : result.reason,
    );
  };

  if (loading)
    return (
      <SectionCard title="Hábitos">
        <p role="status">Carregando hábitos…</p>
      </SectionCard>
    );
  if (error)
    return (
      <SectionCard title="Hábitos">
        <p role="alert">{error}</p>
        <Button onClick={() => void reload()}>Tentar novamente</Button>
      </SectionCard>
    );
  return (
    <SectionCard
      title="Hábitos"
      description="Pequenos passos também contam."
      action={
        <Button asChild variant="outline" size="sm" aria-label="Abrir todos os hábitos">
          <Link to="/habits" search={mode === "demo" ? { mode: "demo" } : {}}>
            Ver hábitos
            <ExternalLink className="ml-2 size-3.5" aria-hidden />
          </Link>
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-medium">
          {completed + light} de {habits.length}{" "}
          {pluralize(completed + light, "concluído", "concluídos")} hoje
        </span>
        <Badge variant="default">Feitos {completed}</Badge>
        <Badge variant="secondary">Modo leve {light}</Badge>
        <Badge variant="outline">Pendentes {pending}</Badge>
        <span className="text-xs tabular-nums text-muted-foreground">{overallProgress}%</span>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={overallProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso geral dos hábitos"
      >
        <div
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${overallProgress}%` }}
        />
      </div>
      <fieldset disabled={saving} className="min-w-0">
        {habits.length === 0 && (
          <p className="mt-3 text-sm">
            Nenhum hábito previsto para hoje. Abra seus hábitos para criar ou ativar um.
          </p>
        )}
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {habits.slice(0, MAX_QUICK_HABITS).map((habit) => {
            const status = getHabitStatus(habit, date);
            const current = checkIns.find(
              (item) => item.habitId === habit.id && item.date === date,
            );
            const hasCheckIn = Boolean(current);
            const save = async (value: number, text: string) => {
              const minimum = habit.minimumTarget?.target ?? 0;
              const result = await recordCheckIn({
                habitId: habit.id,
                date,
                value,
                completed: value >= habit.target.target,
                mode: value < habit.target.target && minimum > 0 && value >= minimum ? "leve" : "principal",
              });
              setMessage(result.valid ? text : result.reason);
            };
            return (
              <QuickHabit
                key={habit.id}
                habit={habit}
                status={status}
                progress={getHabitProgress(habit, date)}
                hasCheckIn={hasCheckIn}
                onComplete={() => updateCheckIn(habit, "principal")}
                {...(habit.minimumTarget ? { onLight: () => updateCheckIn(habit, "leve") } : {})}
                {...(habitIncrementStep(habit) !== null
                  ? {
                      onIncrement: () =>
                        save((current?.value ?? 0) + 1, `+1 em “${habit.name}”.`),
                    }
                  : {})}
                onSkip={() => save(0, `“${habit.name}” dispensado hoje.`)}
                onClear={async () => {
                  const result = await clearCheckIn(habit.id, date);
                  setMessage(result.valid ? `“${habit.name}” reaberto para hoje.` : result.reason);
                }}
              />
            );
          })}
        </ul>
      </fieldset>
      {habits.length > MAX_QUICK_HABITS && (
        <p className="mt-3 text-xs text-muted-foreground">
          +{habits.length - MAX_QUICK_HABITS}{" "}
          {pluralize(habits.length - MAX_QUICK_HABITS, "hábito", "hábitos")} · veja a lista completa
          em Hábitos.
        </p>
      )}
      {message && (
        <p className="mt-3 text-xs" role="status">
          {message}
        </p>
      )}
    </SectionCard>
  );
}

function QuickHabit({
  habit,
  status,
  progress,
  hasCheckIn,
  onComplete,
  onLight,
  onIncrement,
  onSkip,
  onClear,
}: {
  habit: Habit;
  status: HabitStatus;
  progress: number;
  hasCheckIn: boolean;
  onComplete: () => void;
  onLight?: (() => void) | undefined;
  onIncrement?: (() => void) | undefined;
  onSkip: () => void;
  onClear: () => void;
}) {
  return (
    <li className="min-w-0 rounded-lg border border-border/70 p-3">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={habit.name}>
            {habit.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {formatFrequency(habit.frequency)} · {formatTarget(habit.target)}
          </p>
        </div>
        <Badge variant={statusVariants[status]} className="shrink-0">
          {statusLabels[status]}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums">{progress}%</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {onIncrement && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={onIncrement}
            aria-label={`Adicionar 1 em ${habit.name}`}
          >
            +1
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={onComplete}
          aria-label={`Marcar ${habit.name} como feito`}
        >
          <Check className="mr-1 size-3.5" aria-hidden />
          Feito
        </Button>
        {onLight && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={onLight}
            aria-label={`Marcar ${habit.name} como modo leve`}
          >
            <Minus className="mr-1 size-3.5" aria-hidden />
            Leve
          </Button>
        )}
        {status !== "nao_feito" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={onSkip}
            aria-label={`Dispensar ${habit.name} hoje`}
          >
            Dispensar
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={onClear}
          disabled={!hasCheckIn}
          aria-label={`Remover check-in de ${habit.name}`}
        >
          <X className="mr-1 size-3.5" aria-hidden />
          Remover
        </Button>
      </div>
    </li>
  );
}
