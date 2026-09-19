import { useAppDataMode } from "@/hooks/use-app-data-mode";
import { habitOccursOnDate } from "@/lib/habit-data";
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
  const mode = useAppDataMode();
  const date = mode === "demo" ? DEMO_DATE : new Date().toLocaleDateString("en-CA");
  const [deleting, setDeleting] = useState<Habit | null>(null);
  const {
    loading,
    pending,
    error,
    reload,
    deleteHabit,
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

  const todayHabits = activeHabits.filter((habit) => habitOccursOnDate(habit, date));
  const completed = todayHabits.filter((habit) => getHabitStatus(habit, date) === "feito").length;
  const light = todayHabits.filter((habit) => getHabitStatus(habit, date) === "modo_leve").length;
  const unregistered = todayHabits.filter(
    (habit) => getHabitStatus(habit, date) === "nao_registrado",
  ).length;
  const visibleHabits = todayHabits.filter((habit) => {
    const status = getHabitStatus(habit, date);
    return filter === "todos" || (filter === "feitos" ? status === "feito" : status !== "feito");
  });
  const otherHabits = habits.filter((habit) => !habit.active || !habitOccursOnDate(habit, date));

  const saveHabit = async () => {
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
      startDate: date,
    };
    const result = editingId
      ? await updateHabit(
          editingId,
          minimumTarget ? { ...updatePayload, minimumTarget } : updatePayload,
        )
      : await createHabit(minimumTarget ? { ...createPayload, minimumTarget } : createPayload);
    setMessage(
      result.valid
        ? `Hábito ${editingId ? "atualizado" : "criado"} ${mode === "demo" ? "nesta sessão" : "na sua conta"}.`
        : result.reason,
    );
    if (result.valid) {
      if (editingId) {
        setEditingId(null);
        setEditDialogOpen(false);
        setForm(emptyForm());
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

  const setHabitValue = async (habit: Habit, value: string) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return;
    const minimum = habit.minimumTarget?.target ?? 0;
    const mode =
      numericValue >= habit.target.target
        ? "principal"
        : numericValue >= minimum && minimum > 0
          ? "leve"
          : "principal";
    const result = await recordCheckIn({
      habitId: habit.id,
      date: date,
      value: numericValue,
      completed: numericValue >= habit.target.target,
      mode,
    });
    setMessage(result.valid ? `Progresso de “${habit.name}” atualizado.` : result.reason);
  };

  if (loading) return <p role="status">Carregando seus hábitos…</p>;
  if (error)
    return (
      <div role="alert" className="space-y-3">
        <p>{error}</p>
        <Button onClick={() => void reload()}>Tentar novamente</Button>
      </div>
    );
  return (
    <div className="space-y-8">
      {pending && <p role="status">Salvando hábitos…</p>}
      <fieldset disabled={pending} className="min-w-0 space-y-8">
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
          action={
            <Badge variant="outline">
              {mode === "demo" ? "Hábitos desta sessão" : "Hábitos da sua conta"}
            </Badge>
          }
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
                (item) => item.habitId === habit.id && item.date === date,
              );
              return (
                <HabitCard
                  key={`${habit.id}:${checkIn?.value ?? "empty"}:${date}`}
                  habit={habit}
                  date={date}
                  progress={getHabitProgress(habit, date)}
                  status={getHabitStatus(habit, date)}
                  {...(checkIn ? { checkIn } : {})}
                  onEdit={() => startEditing(habit)}
                  editButtonRef={(element) => {
                    editButtonRefs.current[habit.id] = element;
                  }}
                  onToggle={async () => {
                    const result = await deactivateHabit(habit.id);
                    setMessage(result.valid ? "Hábito desativado." : result.reason);
                  }}
                  onValue={(value) => setHabitValue(habit, value)}
                  onClear={async () => {
                    const result = await clearCheckIn(habit.id, date);
                    setMessage(
                      result.valid
                        ? `Hábito “${habit.name}” reaberto para esta data.`
                        : result.reason,
                    );
                  }}
                />
              );
            })}
            {visibleHabits.length === 0 && (
              <EmptyState
                icon={<Waves />}
                title="Nenhum hábito neste filtro"
                description="Escolha outro filtro ou crie um hábito abaixo."
                action={
                  <Button onClick={() => document.getElementById("habit-name")?.focus()}>
                    Criar hábito
                  </Button>
                }
              />
            )}
          </div>
        </SectionCard>

        <div id="new-habit-form">
          <SectionCard
            title="Novo hábito personalizado"
            description={
              mode === "demo"
                ? "As alterações ficam apenas nesta sessão local."
                : "As alterações são salvas na sua conta."
            }
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
              <p className="mt-4 text-sm" role="status">
                {message}
              </p>
            )}
          </SectionCard>
        </div>

        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            if (pending) return;
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
              <DialogDescription className="break-words">
                Atualize os dados de{" "}
                {editingId ? habits.find((habit) => habit.id === editingId)?.name : "seu hábito"}.
                As alterações {mode === "demo" ? "ficam nesta sessão" : "são salvas na sua conta"}.
              </DialogDescription>
            </DialogHeader>
            <fieldset disabled={pending} className="min-w-0">
              <HabitForm
                form={form}
                setForm={setForm}
                onSave={saveHabit}
                editing
                onCancel={cancelEditing}
                inDialog
              />
            </fieldset>
            {message && (
              <p className="text-sm text-destructive" role="alert">
                {message}
              </p>
            )}
          </DialogContent>
        </Dialog>

        {mode === "authenticated" && habits.length > 0 && (
          <SectionCard
            title="Excluir hábito"
            description="A exclusão também remove seus registros. Esta ação exige confirmação."
          >
            <div className="flex flex-wrap gap-2">
              {habits.map((habit) => (
                <Button
                  key={habit.id}
                  variant="outline"
                  className="h-auto min-h-11 whitespace-normal break-words text-left"
                  onClick={() => {
                    setMessage("");
                    setDeleting(habit);
                  }}
                >
                  Excluir {habit.name}
                </Button>
              ))}
            </div>
          </SectionCard>
        )}
        <Dialog
          open={Boolean(deleting)}
          onOpenChange={(open) => {
            if (!open && !pending) setDeleting(null);
          }}
        >
          <DialogContent
            onEscapeKeyDown={(event) => {
              if (pending) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (pending) event.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>Excluir hábito?</DialogTitle>
              <DialogDescription className="break-words">
                Excluir “{deleting?.name}” e seus registros permanentemente?
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                if (!deleting) return;
                const result = await deleteHabit(deleting.id);
                setMessage(result.valid ? "Hábito excluído." : result.reason);
                if (result.valid) setDeleting(null);
              }}
            >
              Confirmar exclusão
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            {message && <p role="status">{message}</p>}
          </DialogContent>
        </Dialog>
        {otherHabits.length > 0 && (
          <SectionCard
            title="Outros hábitos"
            description="Hábitos desativados ou previstos para outra data continuam disponíveis para edição."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {otherHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 p-4"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">{habit.name}</p>
                    <Badge variant="outline" className="mt-2">
                      {habit.active ? "Outra data" : "Desativado"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(habit)}
                      ref={(element) => {
                        editButtonRefs.current[habit.id] = element;
                      }}
                      aria-label={`Editar ${habit.name}`}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const result = habit.active
                          ? await deactivateHabit(habit.id)
                          : await activateHabit(habit.id);
                        setMessage(
                          result.valid
                            ? habit.active
                              ? "Hábito desativado."
                              : "Hábito reativado."
                            : result.reason,
                        );
                      }}
                      aria-label={`${habit.active ? "Desativar" : "Reativar"} ${habit.name}`}
                    >
                      <ToggleRight className="mr-2 size-4" aria-hidden />
                      {habit.active ? "Desativar" : "Reativar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </fieldset>
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
  const fieldId = (name: string) => `${inDialog ? "edit-" : ""}habit-${name}`;
  const update = <K extends keyof HabitForm>(key: K, value: HabitForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className={inDialog ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
      <div className="sm:col-span-2">
        <Label htmlFor={fieldId("name")}>Nome</Label>
        <Input
          id={fieldId("name")}
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Ex.: Caminhar ao ar livre"
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor={fieldId("frequency")}>Frequência</Label>
        <Select
          value={form.frequencyType}
          onValueChange={(value: FrequencyType) => update("frequencyType", value)}
        >
          <SelectTrigger id={fieldId("frequency")} className="mt-2">
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
          <Label htmlFor={fieldId("interval")}>Intervalo</Label>
          <Input
            id={fieldId("interval")}
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
        <Label htmlFor={fieldId("target-type")}>Meta principal</Label>
        <Select
          value={form.targetType}
          onValueChange={(value: TargetType) => update("targetType", value)}
        >
          <SelectTrigger id={fieldId("target-type")} className="mt-2">
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
        <Label htmlFor={fieldId("target")}>Valor da meta</Label>
        <Input
          id={fieldId("target")}
          type="number"
          min="1"
          value={form.target}
          onChange={(event) => update("target", event.target.value)}
          className="mt-2"
        />
      </div>
      {form.targetType === "quantity" && (
        <div>
          <Label htmlFor={fieldId("unit")}>Unidade</Label>
          <Input
            id={fieldId("unit")}
            value={form.unit}
            onChange={(event) => update("unit", event.target.value)}
            className="mt-2"
            placeholder="Ex.: copos"
          />
        </div>
      )}
      <div>
        <Label htmlFor={fieldId("minimum")}>Meta mínima (opcional)</Label>
        <Input
          id={fieldId("minimum")}
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
