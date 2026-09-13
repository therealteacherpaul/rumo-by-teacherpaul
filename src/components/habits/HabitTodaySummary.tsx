import { Check, ExternalLink, Minus, X } from "lucide-react";

import { DemoBadge } from "@/components/common/DemoBadge";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHabits } from "@/hooks/use-habits";
import {
  habitOccursOnDate,
  type Habit,
  type HabitFrequency,
  type HabitStatus,
  type HabitTarget,
} from "@/lib/habit-data";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

const DEMO_DATE = "2026-09-08";

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

function valueForTarget(target: HabitTarget | undefined) {
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
  const unregistered = statuses.filter((status) => status === "nao_registrado").length;
  const overallProgress = habits.length
    ? Math.round(
        habits.reduce((total, habit) => total + getHabitProgress(habit, DEMO_DATE), 0) /
          habits.length,
      )
    : 0;

  const updateCheckIn = (habit: Habit, value: number, mode: "principal" | "leve") => {
    recordCheckIn({
      habitId: habit.id,
      date: DEMO_DATE,
      value,
      completed: mode === "principal",
      mode,
    });
    setMessage(`“${habit.name}” atualizado nesta demonstração.`);
  };

  return (
    <SectionCard
      title="Hábitos de hoje"
      description="Consistência flexível: a meta mínima também é um passo válido."
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DemoBadge />
          <Button asChild variant="outline" size="sm">
            <Link to="/habits">
              Ver todos os hábitos
              <ExternalLink className="ml-2 size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Summary label="Previstos" value={String(habits.length)} />
        <Summary label="Concluídos" value={String(completed)} />
        <Summary label="Modo leve" value={String(light)} />
        <Summary label="Não registrados" value={String(unregistered)} />
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso geral do dia</span>
          <span>{overallProgress}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
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
      </div>
      <ul className="mt-5 space-y-3">
        {habits.map((habit) => {
          const status = getHabitStatus(habit, DEMO_DATE);
          const checkIn = checkIns.find(
            (item) => item.habitId === habit.id && item.date === DEMO_DATE,
          );
          return (
            <HabitTodayItem
              key={habit.id}
              habit={habit}
              status={status}
              progress={getHabitProgress(habit, DEMO_DATE)}
              currentValue={checkIn?.value}
              onComplete={() => updateCheckIn(habit, valueForTarget(habit.target), "principal")}
              onLight={
                habit.minimumTarget
                  ? () => updateCheckIn(habit, valueForTarget(habit.minimumTarget), "leve")
                  : undefined
              }
              onClear={() => {
                clearCheckIn(habit.id, DEMO_DATE);
                setMessage(`Registro de “${habit.name}” removido desta demonstração.`);
              }}
            />
          );
        })}
      </ul>
      {message && (
        <p className="mt-4 text-xs text-success" role="status">
          {message}
        </p>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Os registros são locais e desaparecem ao recarregar a demonstração.
      </p>
    </SectionCard>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function HabitTodayItem({
  habit,
  status,
  progress,
  currentValue,
  onComplete,
  onLight,
  onClear,
}: {
  habit: Habit;
  status: HabitStatus;
  progress: number;
  currentValue?: number;
  onComplete: () => void;
  onLight?: () => void;
  onClear: () => void;
}) {
  const [value, setValue] = useState(currentValue === undefined ? "" : String(currentValue));
  return (
    <li className="rounded-lg border border-border/70 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-medium">{habit.name}</p>
          <p className="mt-0.5 break-words text-xs text-muted-foreground">
            {formatFrequency(habit.frequency)} · {formatTarget(habit.target)}
          </p>
        </div>
        <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{progress}%</span>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="w-24">
          <label htmlFor={`today-habit-${habit.id}`} className="text-xs text-muted-foreground">
            Valor
          </label>
          <Input
            id={`today-habit-${habit.id}`}
            type="number"
            min="0"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="mt-1 h-8"
            aria-label={`Valor de ${habit.name}`}
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onComplete}
          aria-label={`Marcar ${habit.name} como feito`}
        >
          <Check className="mr-1.5 size-3.5" aria-hidden />
          Feito
        </Button>
        {onLight && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onLight}
            aria-label={`Marcar ${habit.name} como modo leve`}
          >
            <Minus className="mr-1.5 size-3.5" aria-hidden />
            Modo leve
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onClear}
          disabled={!currentValue}
          aria-label={`Remover check-in de ${habit.name}`}
        >
          <X className="mr-1.5 size-3.5" aria-hidden />
          Remover
        </Button>
      </div>
    </li>
  );
}
