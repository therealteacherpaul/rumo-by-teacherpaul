import { Check, ExternalLink, Minus, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/hooks/use-habits";
import {
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
};
const statusVariants: Record<HabitStatus, "default" | "secondary" | "outline"> = {
  nao_registrado: "outline",
  em_progresso: "secondary",
  feito: "default",
  modo_leve: "secondary",
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
  const { activeHabits, checkIns, getHabitProgress, getHabitStatus, recordCheckIn, clearCheckIn } =
    useHabits();
  const [message, setMessage] = useState("");
  const habits = activeHabits.filter((habit) => habitOccursOnDate(habit, DEMO_DATE));
  const statuses = habits.map((habit) => getHabitStatus(habit, DEMO_DATE));
  const completed = statuses.filter((status) => status === "feito").length;
  const light = statuses.filter((status) => status === "modo_leve").length;
  const pending = habits.length - completed - light;
  const overallProgress = habits.length
    ? Math.round(
        habits.reduce((total, habit) => total + getHabitProgress(habit, DEMO_DATE), 0) /
          habits.length,
      )
    : 0;

  const updateCheckIn = (habit: Habit, mode: "principal" | "leve") => {
    recordCheckIn({
      habitId: habit.id,
      date: DEMO_DATE,
      value: targetValue(mode === "principal" ? habit.target : habit.minimumTarget),
      completed: mode === "principal",
      mode,
    });
    setMessage(`“${habit.name}” atualizado nesta demonstração.`);
  };

  return (
    <SectionCard
      title="Hábitos"
      description="Pequenos passos também contam."
      action={
        <Button asChild variant="outline" size="sm" aria-label="Abrir todos os hábitos">
          <Link to="/habits">
            Ver hábitos
            <ExternalLink className="ml-2 size-3.5" aria-hidden />
          </Link>
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-medium">
          {completed + light} de {habits.length} concluídos hoje
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
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {habits.slice(0, MAX_QUICK_HABITS).map((habit) => {
          const status = getHabitStatus(habit, DEMO_DATE);
          const hasCheckIn = checkIns.some(
            (item) => item.habitId === habit.id && item.date === DEMO_DATE,
          );
          return (
            <QuickHabit
              key={habit.id}
              habit={habit}
              status={status}
              progress={getHabitProgress(habit, DEMO_DATE)}
              hasCheckIn={hasCheckIn}
              onComplete={() => updateCheckIn(habit, "principal")}
              {...(habit.minimumTarget
                ? { onLight: () => updateCheckIn(habit, "leve") }
                : {})}
              onClear={() => {
                clearCheckIn(habit.id, DEMO_DATE);
                setMessage(`Registro de “${habit.name}” removido desta demonstração.`);
              }}
            />
          );
        })}
      </ul>
      {habits.length > MAX_QUICK_HABITS && (
        <p className="mt-3 text-xs text-muted-foreground">
          +{habits.length - MAX_QUICK_HABITS} hábitos · veja a lista completa em Hábitos.
        </p>
      )}
      {message && (
        <p className="mt-3 text-xs text-success" role="status">
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
  onClear,
}: {
  habit: Habit;
  status: HabitStatus;
  progress: number;
  hasCheckIn: boolean;
  onComplete: () => void;
  onLight?: (() => void) | undefined;
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
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{progress}%</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
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
