import { createFileRoute } from "@tanstack/react-router";
import { Check, Edit3, ToggleLeft, ToggleRight, Waves, X } from "lucide-react";
import { useRef, useState } from "react";

import { DemoNotice } from "@/components/common/DemoBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHabits } from "@/hooks/use-habits";
import { type Habit, type HabitFrequency, type HabitTarget } from "@/lib/habit-data";

export const Route = createFileRoute("/_app/habits")({
  head: () => ({
    meta: [
      { title: "Hábitos — RUMO by Teacher Paul" },
      { name: "description", content: "Acompanhe hábitos com consistência flexível." },
    ],
  }),
  component: HabitsPage,
});

const DEMO_DATE = "2026-09-08";
type Filter = "todos" | "feitos" | "pendentes";
type TargetType = HabitTarget["type"];
type FrequencyType = HabitFrequency["type"];

const statusLabels = {
  nao_registrado: "Não registrado",
  em_progresso: "Em progresso",
  feito: "Feito",
  modo_leve: "Modo leve",
} as const;

const statusVariants = {
  nao_registrado: "outline",
  em_progresso: "secondary",
  feito: "default",
  modo_leve: "secondary",
} as const;

function formatFrequency(frequency: HabitFrequency) {
  if (frequency.type === "daily") return "Diário";
  if (frequency.type === "everyDays") return `A cada ${frequency.interval} dias`;
  return `A cada ${frequency.interval} horas`;
}

function formatTarget(target: HabitTarget) {
  if (target.type === "occurrence")
    return `${target.target} ocorrência${target.target === 1 ? "" : "s"}`;
  if (target.type === "durationMin") return `${target.target} min`;
  return `${target.target} ${target.unit}`;
}

function buildTarget(type: TargetType, value: string, unit: string): HabitTarget {
  const target = Number(value);
  if (type === "quantity") return { type, target, unit };
  return { type, target };
}

function buildFrequency(type: FrequencyType, interval: string): HabitFrequency {
  if (type === "daily") return { type };
  return { type, interval: Number(interval) };
}

function HabitsPage() {
  const {
    habits,
    checkIns,
    activeHabits,
    createHabit,
    updateHabit,
    activateHabit,
    deactivateHabit,
    recordCheckIn,
    clearCheckIn,
    getHabitProgress,
    getHabitStatus,
  } = useHabits();
  const [filter, setFilter] = useState<Filter>("todos");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [form, setForm] = useState<HabitForm>(() => emptyForm());
  const editButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastEditingId = useRef<string | null>(null);

  const todayHabits = activeHabits.filter((habit) => habitOccursToday(habit));
  const completed = todayHabits.filter(
    (habit) => getHabitStatus(habit, DEMO_DATE) === "feito",
  ).length;
  const light = todayHabits.filter(
    (habit) => getHabitStatus(habit, DEMO_DATE) === "modo_leve",
  ).length;
  const unregistered = todayHabits.filter(
    (habit) => getHabitStatus(habit, DEMO_DATE) === "nao_registrado",
  ).length;
  const visibleHabits = todayHabits.filter((habit) => {
    const status = getHabitStatus(habit, DEMO_DATE);
    return filter === "todos" || (filter === "feitos" ? status === "feito" : status !== "feito");
  });
  const inactiveHabits = habits.filter((habit) => !habit.active);

  const saveHabit = () => {
    const target = buildTarget(form.targetType, form.target, form.unit);
    const minimumTarget = form.minimumTarget.trim()
      ? buildTarget(form.targetType, form.minimumTarget, form.unit)
      : undefined;
    const frequency = buildFrequency(form.frequencyType, form.interval);
    const updatePayload: Parameters<typeof updateHabit>[1] = {
      name: form.name,
      frequency,
      target,
    };
    const createPayload: Omit<Habit, "id" | "minimumTarget"> & {
      minimumTarget?: HabitTarget;
    } = {
      name: form.name,
      source: "user",
      active: true,
      frequency,
      target,
      startDate: DEMO_DATE,
    };
    const result = editingId
      ? updateHabit(editingId, minimumTarget ? { ...updatePayload, minimumTarget } : updatePayload)
      : createHabit(minimumTarget ? { ...createPayload, minimumTarget } : createPayload);
    setMessage(
      result.valid ? `Hábito ${editingId ? "atualizado" : "criado"} nesta sessão.` : result.reason,
    );
    if (result.valid) {
      if (editingId) {
        setEditingId(null);
        setEditDialogOpen(false);
      } else {
        setForm(emptyForm());
      }
    }
  };

  const startEditing = (habit: Habit) => {
    lastEditingId.current = habit.id;
    setEditingId(habit.id);
    setForm({
      name: habit.name,
      frequencyType: habit.frequency.type,
      interval: habit.frequency.type === "daily" ? "1" : String(habit.frequency.interval),
      targetType: habit.target.type,
      target: String(habit.target.target),
      minimumTarget: habit.minimumTarget ? String(habit.minimumTarget.target) : "",
      unit: habit.target.type === "quantity" ? habit.target.unit : "vezes",
    });
    setEditDialogOpen(true);
    setMessage("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDialogOpen(false);
    setForm(emptyForm());
    setMessage("");
  };

  const setHabitValue = (habit: Habit, value: string) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return;
    const minimum = habit.minimumTarget?.target ?? 0;
    const mode =
      numericValue >= habit.target.target
        ? "principal"
        : numericValue >= minimum && minimum > 0
          ? "leve"
          : "principal";
    recordCheckIn({
      habitId: habit.id,
      date: DEMO_DATE,
      value: numericValue,
      completed: numericValue >= habit.target.target,
      mode,
    });
    setMessage(`Progresso de “${habit.name}” atualizado nesta sessão.`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        showDemoBadge={false}
        eyebrow="Consistência flexível"
        title="Hábitos"
        description="Pequenas práticas que cabem na vida real, com uma meta principal e espaço para um modo leve."
      />
      <DemoNotice />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label="Ativos" value={String(activeHabits.length)} hint="de 12 possíveis" />
        <Summary label="Feitos hoje" value={String(completed)} hint="meta principal" />
        <Summary label="Modo leve" value={String(light)} hint="também conta" />
        <Summary label="Não registrados" value={String(unregistered)} hint="sem cobrança" />
      </div>

      <SectionCard
        title="Seus hábitos"
        description="Registre o que aconteceu hoje. Um dia não registrado não é uma falha."
        action={<Badge variant="outline">Hábitos desta sessão</Badge>}
      >
        <div className="flex flex-wrap gap-2" aria-label="Filtrar hábitos">
          {(
            [
              ["todos", "Todos"],
              ["feitos", "Feitos"],
              ["pendentes", "Pendentes"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="mt-5 grid gap-4">
          {visibleHabits.map((habit) => {
            const checkIn = checkIns.find(
              (item) => item.habitId === habit.id && item.date === DEMO_DATE,
            );
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                date={DEMO_DATE}
                progress={getHabitProgress(habit, DEMO_DATE)}
                status={getHabitStatus(habit, DEMO_DATE)}
                {...(checkIn ? { checkIn } : {})}
                onEdit={() => startEditing(habit)}
                editButtonRef={(element) => {
                  editButtonRefs.current[habit.id] = element;
                }}
                onToggle={() => {
                  const result = deactivateHabit(habit.id);
                  setMessage(result.valid ? "Hábito desativado nesta sessão." : result.reason);
                }}
                onValue={(value) => setHabitValue(habit, value)}
                onClear={() => {
                  clearCheckIn(habit.id, DEMO_DATE);
                  setMessage(`Registro de “${habit.name}” removido desta demonstração.`);
                }}
              />
            );
          })}
          {visibleHabits.length === 0 && (
            <EmptyState
              icon={<Waves />}
              title="Nenhum hábito neste filtro"
              description="Escolha outro filtro para continuar acompanhando seus hábitos."
            />
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Novo hábito personalizado"
        description="As alterações ficam apenas nesta sessão local e não são salvas na conta."
      >
        <HabitForm
          form={form}
          setForm={setForm}
          onSave={saveHabit}
          editing={Boolean(editingId)}
          onCancel={() => {
            setForm(emptyForm());
            setMessage("");
          }}
        />
        {message && (
          <p className="mt-4 text-sm text-success" role="status">
            {message}
          </p>
        )}
      </SectionCard>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) cancelEditing();
          else setEditDialogOpen(true);
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (lastEditingId.current) editButtonRefs.current[lastEditingId.current]?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Editar hábito</DialogTitle>
            <DialogDescription>
              Atualize os dados de{" "}
              {editingId ? habits.find((habit) => habit.id === editingId)?.name : "seu hábito"}. As
              alterações ficam nesta sessão.
            </DialogDescription>
          </DialogHeader>
          <HabitForm
            form={form}
            setForm={setForm}
            onSave={saveHabit}
            editing
            onCancel={cancelEditing}
            inDialog
          />
          {message && (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {inactiveHabits.length > 0 && (
        <SectionCard
          title="Hábitos desativados"
          description="Eles não aparecem nos registros novos, mas continuam preservados."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {inactiveHabits.map((habit) => (
              <div
                key={habit.id}
                className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 p-4"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">{habit.name}</p>
                  <Badge variant="outline" className="mt-2">
                    Desativado
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const result = activateHabit(habit.id);
                    setMessage(result.valid ? "Hábito reativado nesta sessão." : result.reason);
                  }}
                  aria-label={`Reativar ${habit.name}`}
                >
                  <ToggleRight className="mr-2 size-4" aria-hidden />
                  Reativar
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

type HabitFormState = {
  name: string;
  frequencyType: FrequencyType;
  interval: string;
  targetType: TargetType;
  target: string;
  minimumTarget: string;
  unit: string;
};
type HabitForm = HabitFormState;

function emptyForm(): HabitForm {
  return {
    name: "",
    frequencyType: "daily",
    interval: "1",
    targetType: "occurrence",
    target: "1",
    minimumTarget: "",
    unit: "vezes",
  };
}

function Summary({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function HabitCard({
  habit,
  status,
  progress,
  checkIn,
  onEdit,
  onToggle,
  onValue,
  onClear,
  editButtonRef,
}: {
  habit: Habit;
  status: keyof typeof statusLabels;
  progress: number;
  checkIn?: { value: number } | undefined;
  date: string;
  onEdit: () => void;
  onToggle: () => void;
  onValue: (value: string) => void;
  onClear: () => void;
  editButtonRef: (element: HTMLButtonElement | null) => void;
}) {
  const [value, setValue] = useState(checkIn ? String(checkIn.value) : "");
  return (
    <article className="rounded-xl border border-border/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-medium">{habit.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatFrequency(habit.frequency)} · Meta: {formatTarget(habit.target)}
            {habit.minimumTarget ? ` · Leve: ${formatTarget(habit.minimumTarget)}` : ""}
          </p>
        </div>
        <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso do dia</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gold transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {status === "modo_leve" && (
        <p className="mt-3 text-sm text-success">
          Você cumpriu sua meta mínima. Isso também conta.
        </p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <Label htmlFor={`habit-value-${habit.id}`}>
            Registrar{" "}
            {habit.target.type === "durationMin"
              ? "minutos"
              : habit.target.type === "quantity"
                ? habit.target.unit
                : "ocorrências"}
          </Label>
          <Input
            id={`habit-value-${habit.id}`}
            type="number"
            min="0"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="mt-2"
            aria-label={`Progresso de ${habit.name}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => onValue(value)}
            disabled={!value}
            aria-label={`Registrar progresso de ${habit.name}`}
          >
            <Check className="mr-2 size-4" aria-hidden />
            Registrar
          </Button>
          {checkIn && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClear}
              aria-label={`Remover registro de ${habit.name}`}
            >
              <X className="mr-2 size-4" aria-hidden />
              Remover
            </Button>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          ref={editButtonRef}
          aria-label={`Editar ${habit.name}`}
        >
          <Edit3 className="mr-2 size-4" aria-hidden />
          Editar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label={`Desativar ${habit.name}`}
        >
          <ToggleLeft className="mr-2 size-4" aria-hidden />
          Desativar
        </Button>
      </div>
    </article>
  );
}

function HabitForm({
  form,
  setForm,
  onSave,
  editing,
  onCancel,
  inDialog = false,
}: {
  form: HabitForm;
  setForm: (value: HabitForm | ((current: HabitForm) => HabitForm)) => void;
  onSave: () => void;
  editing: boolean;
  onCancel: () => void;
  inDialog?: boolean;
}) {
  const update = <K extends keyof HabitForm>(key: K, value: HabitForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className={inDialog ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
      <div className="sm:col-span-2">
        <Label htmlFor="habit-name">Nome</Label>
        <Input
          id="habit-name"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Ex.: Caminhar ao ar livre"
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor="habit-frequency">Frequência</Label>
        <Select
          value={form.frequencyType}
          onValueChange={(value: FrequencyType) => update("frequencyType", value)}
        >
          <SelectTrigger id="habit-frequency" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Diário</SelectItem>
            <SelectItem value="everyDays">A cada X dias</SelectItem>
            <SelectItem value="everyHours">A cada X horas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.frequencyType !== "daily" && (
        <div>
          <Label htmlFor="habit-interval">Intervalo</Label>
          <Input
            id="habit-interval"
            type="number"
            min="1"
            value={form.interval}
            onChange={(event) => update("interval", event.target.value)}
            className="mt-2"
            aria-label="Intervalo da frequência"
          />
        </div>
      )}
      <div>
        <Label htmlFor="habit-target-type">Meta principal</Label>
        <Select
          value={form.targetType}
          onValueChange={(value: TargetType) => update("targetType", value)}
        >
          <SelectTrigger id="habit-target-type" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="occurrence">Ocorrências</SelectItem>
            <SelectItem value="durationMin">Duração em minutos</SelectItem>
            <SelectItem value="quantity">Quantidade</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="habit-target">Valor da meta</Label>
        <Input
          id="habit-target"
          type="number"
          min="1"
          value={form.target}
          onChange={(event) => update("target", event.target.value)}
          className="mt-2"
        />
      </div>
      {form.targetType === "quantity" && (
        <div>
          <Label htmlFor="habit-unit">Unidade</Label>
          <Input
            id="habit-unit"
            value={form.unit}
            onChange={(event) => update("unit", event.target.value)}
            className="mt-2"
            placeholder="Ex.: copos"
          />
        </div>
      )}
      <div>
        <Label htmlFor="habit-minimum">Meta mínima (opcional)</Label>
        <Input
          id="habit-minimum"
          type="number"
          min="1"
          value={form.minimumTarget}
          onChange={(event) => update("minimumTarget", event.target.value)}
          className="mt-2"
          placeholder="Modo leve"
        />
      </div>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
        <Button type="button" onClick={onSave}>
          {editing ? "Salvar hábito" : "Criar hábito"}
        </Button>
        {editing && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

function habitOccursToday(habit: Habit) {
  return habit.startDate <= DEMO_DATE;
}
