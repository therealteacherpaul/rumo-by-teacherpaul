import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DemoNotice } from "@/components/common/DemoBadge";
import { useCategories } from "@/hooks/use-categories";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoQuery } from "@/hooks/use-demo-query";
import { useAppDataMode } from "@/hooks/use-app-data-mode";
import { focusSessions, tasks as demoTasks } from "@/lib/demo-data";
import { TaskDataProvider } from "@/components/tasks/TaskDataProvider";
import { useTaskData } from "@/hooks/use-task-data";
import { useAuth } from "@/hooks/use-auth";
import {
  accumulateFocusSession,
  loadFocusSessions,
  type FocusSession,
} from "@/lib/focus-repository";

export const Route = createFileRoute("/_app/focus")({
  head: () => ({
    meta: [
      { title: "Foco — RUMO by Teacher Paul" },
      {
        name: "description",
        content:
          "Temporizador de foco com tarefa selecionada, duração planejada e histórico das últimas sessões.",
      },
      { property: "og:title", content: "Foco — RUMO by Teacher Paul" },
      {
        property: "og:description",
        content: "Blocos de foco protegidos, com duração planejada e histórico honesto.",
      },
    ],
  }),
  component: FocusPage,
});

const durations = [25, 50, 90];
const ACTIVE_FOCUS_KEY = "rumo:focus:active";
type ActiveFocusCheckpoint = {
  taskId: string;
  plannedMin: number;
  startedAt: string;
  elapsedSec: number;
};

/** Saves a block left running by a reload, crash or lost connection. Keeps it for retry on failure. */
async function recoverInterruptedFocus(userId: string) {
  const key = `${ACTIVE_FOCUS_KEY}:${userId}`;
  let checkpoint: ActiveFocusCheckpoint | null = null;
  try {
    const raw = window.localStorage.getItem(key);
    checkpoint = raw ? (JSON.parse(raw) as ActiveFocusCheckpoint) : null;
  } catch {
    checkpoint = null;
  }
  if (!checkpoint) return;
  const actualMinutes = Math.floor(checkpoint.elapsedSec / 60);
  if (actualMinutes >= 1 && checkpoint.taskId) {
    const started = new Date(checkpoint.startedAt).getTime();
    await accumulateFocusSession(userId, {
      task_id: checkpoint.taskId,
      started_at: checkpoint.startedAt,
      ended_at: new Date(started + checkpoint.elapsedSec * 1000).toISOString(),
      planned_minutes: checkpoint.plannedMin,
      actual_minutes: actualMinutes,
      status: "ended",
    });
  }
  window.localStorage.removeItem(key);
}

function carriedFocusMinutes(sessions: FocusSession[], taskId: string) {
  const today = new Date().toDateString();
  let total = 0;
  for (const s of sessions) {
    if (s.task_id !== taskId || new Date(s.started_at).toDateString() !== today) continue;
    if (s.status === "completed") break;
    if (s.status === "ended") total += s.actual_minutes;
  }
  return total;
}
type LocalFocusSession = Omit<(typeof focusSessions)[number], "category"> & {
  category: string;
  status: "Concluída" | "Encerrada";
};

function FocusPage() {
  const mode = useAppDataMode();
  const { user } = useAuth();
  if (mode === "demo") return <DemoFocus />;
  return user ? (
    <TaskDataProvider key={user.id} userId={user.id}>
      <AuthenticatedFocus />
    </TaskDataProvider>
  ) : null;
}

function DemoFocus() {
  const { categories, categoryName } = useCategories();
  const { data: sessions = [] } = useDemoQuery(["focus", "sessions"], () => focusSessions);
  return (
    <FocusTimer
      tasks={demoTasks}
      sessions={sessions}
      categoryName={(id) => {
        const category = categories.find((item) => item.id === id);
        return category ? categoryName(category.id) : id;
      }}
      demo
    />
  );
}

function AuthenticatedFocus() {
  const data = useTaskData();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      await recoverInterruptedFocus(user.id);
      setSessions(await loadFocusSessions(user.id));
    } catch {
      setHistoryError("Não foi possível carregar o histórico. Tente novamente.");
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);
  const tasks = data.tasks.filter((task) => !task.archived);
  if (!tasks.length) {
    return (
      <EmptyState
        icon={<Timer className="size-5" />}
        title="Crie uma tarefa para iniciar um bloco de foco"
        description="Escolha uma tarefa real, defina a duração e comece quando estiver pronto."
        action={
          <Button asChild>
            <Link to="/tasks">Criar tarefa</Link>
          </Button>
        }
      />
    );
  }
  return (
    <FocusTimer
      tasks={tasks.map((task) => ({
        id: task.id,
        title: task.title,
        category: task.category_id ?? "",
        estimateMin: task.estimate_min ?? 0,
      }))}
      sessions={[]}
      persistedSessions={sessions}
      historyLoading={historyLoading}
      historyError={historyError}
      onRetryHistory={loadHistory}
      onSaveSession={async (session) => {
        if (!user) return;
        const { session: saved, replacedId } = await accumulateFocusSession(user.id, session);
        setSessions((current) =>
          [saved, ...current.filter((item) => item.id !== (replacedId ?? saved.id))].slice(0, 50),
        );
      }}
      categoryName={(id) =>
        data.categories.find((category) => category.id === id)?.name ?? "Sem categoria"
      }
      demo={false}
    />
  );
}

function FocusTimer({
  tasks,
  sessions,
  categoryName,
  demo,
  persistedSessions,
  historyLoading = false,
  historyError = "",
  onRetryHistory,
  onSaveSession,
}: {
  tasks: { id: string; title: string; category: string; estimateMin?: number }[];
  sessions: typeof focusSessions;
  categoryName: (id: string) => string;
  demo: boolean;
  persistedSessions?: FocusSession[];
  historyLoading?: boolean;
  historyError?: string;
  onRetryHistory?: () => void;
  onSaveSession?: (
    session: Omit<FocusSession, "id" | "user_id" | "created_at" | "updated_at">,
  ) => Promise<void>;
}) {
  const sessionMessage = (action: string) => `${action}${demo ? " nesta demonstração" : ""}.`;
  const { user } = useAuth();
  const storageKey = !demo && user ? `${ACTIVE_FOCUS_KEY}:${user.id}` : null;
  const [localSessions, setLocalSessions] = useState<LocalFocusSession[]>(() =>
    sessions.map((session) => ({ ...session, status: "Concluída" })),
  );
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [duration, setDuration] = useState(50);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("50");
  const [remainingSeconds, setRemainingSeconds] = useState(50 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [focusMessage, setFocusMessage] = useState("");
  const blockSecondsRef = useRef(0);
  const startedAtRef = useRef<string | null>(null);
  // Once the user picks a duration by hand, the task estimate never overrides it again.
  const [durationTouched, setDurationTouched] = useState(false);
  const estimateMinutes = tasks.find((task) => task.id === taskId)?.estimateMin ?? 0;
  useEffect(() => {
    if (durationTouched || isRunning || hasStarted) return;
    if (!Number.isInteger(estimateMinutes) || estimateMinutes < 1) return;
    const next = Math.min(240, Math.max(5, estimateMinutes));
    setDuration(next);
    setIsCustomDuration(!durations.includes(next));
    setCustomMinutes(String(next));
    setRemainingSeconds(next * 60);
  }, [durationTouched, estimateMinutes, hasStarted, isRunning]);

  // Minutes already done today on this task in interrupted blocks (since its last completed block).
  const carriedMinutes = demo ? 0 : carriedFocusMinutes(persistedSessions ?? [], taskId);
  const initialSeconds = Math.max(60, (duration - carriedMinutes) * 60);
  useEffect(() => {
    if (isRunning || hasStarted) return;
    setRemainingSeconds(initialSeconds);
  }, [initialSeconds, isRunning, hasStarted]);

  const history = demo
    ? localSessions
    : (persistedSessions ?? []).map((s) => ({
        id: s.id,
        date: new Date(s.started_at).toLocaleDateString("pt-BR"),
        task: tasks.find((t) => t.id === s.task_id)?.title ?? "Tarefa arquivada",
        category: tasks.find((t) => t.id === s.task_id)?.category ?? "",
        plannedMin: s.planned_minutes,
        realMin: s.actual_minutes,
        status: s.status === "completed" ? "Concluída" : ("Encerrada" as const),
      }));

  const selected = tasks.find((t) => t.id === taskId);
  const customDurationValue = Number(customMinutes);
  const isCustomDurationValid =
    customMinutes.trim() !== "" &&
    Number.isInteger(customDurationValue) &&
    customDurationValue >= 5 &&
    customDurationValue <= 240;
  const customDurationMessage =
    customMinutes.trim() === ""
      ? "Informe a duração em minutos."
      : !Number.isInteger(customDurationValue)
        ? "Use um número inteiro de minutos."
        : customDurationValue < 5 || customDurationValue > 240
          ? "Informe um valor entre 5 e 240 minutos."
          : customDurationValue % 5 !== 0
            ? "Você pode usar qualquer valor válido; múltiplos de 5 são recomendados."
            : "";
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  // Checkpoint the running block locally so a reload, crash or lost connection never loses time.
  useEffect(() => {
    if (!storageKey || !hasStarted || !startedAtRef.current || !selected) return;
    const elapsedSec = blockSecondsRef.current - remainingSeconds;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          taskId: selected.id,
          plannedMin: duration,
          startedAt: startedAtRef.current,
          elapsedSec,
        } satisfies ActiveFocusCheckpoint),
      );
    } catch {
      /* storage indisponível */
    }
  }, [storageKey, hasStarted, remainingSeconds, duration, selected]);

  const persistProgress = (status: "completed" | "ended", remainingNow: number) => {
    const elapsedSec = blockSecondsRef.current - remainingNow;
    const actualMinutes = Math.floor(elapsedSec / 60);
    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    if (demo || !onSaveSession || !selected || !startedAt || actualMinutes < 1) {
      if (storageKey) window.localStorage.removeItem(storageKey);
      return Promise.resolve(false);
    }
    return onSaveSession({
      task_id: selected.id,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      planned_minutes: duration,
      actual_minutes: actualMinutes,
      status,
    }).then(() => {
      if (storageKey) window.localStorage.removeItem(storageKey);
      return true;
    });
  };

  const addLocalSession = (status: "Concluída" | "Encerrada", realMin: number) =>
    setLocalSessions((currentSessions) => [
      ...currentSessions,
      {
        id: `local-${currentSessions.length + 1}`,
        date: "Agora",
        task: selected?.title ?? "Tarefa selecionada",
        category: selected?.category ?? "rumo",
        plannedMin: duration,
        realMin,
        status,
      },
    ]);

  useEffect(() => {
    if (!hasStarted || remainingSeconds !== 0) return;
    setIsRunning(false);
    setHasStarted(false);
    if (demo) {
      addLocalSession("Concluída", duration);
      setFocusMessage("Sessão encerrada nesta demonstração.");
      return;
    }
    void persistProgress("completed", 0)
      .then(() => setFocusMessage("Bloco concluído e salvo no histórico."))
      .catch(() => setFocusMessage("Bloco concluído; o tempo será salvo quando a conexão voltar."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, hasStarted]);

  const startFocus = () => {
    if (remainingSeconds === 0 || (isCustomDuration && !isCustomDurationValid)) return;
    if (!startedAtRef.current) {
      blockSecondsRef.current = remainingSeconds;
      startedAtRef.current = new Date().toISOString();
    }
    setIsRunning(true);
    setHasStarted(true);
    setFocusMessage(sessionMessage("Sessão de foco iniciada"));
  };

  const resetFocus = () => {
    setIsRunning(false);
    setHasStarted(false);
    if (demo) {
      startedAtRef.current = null;
      setRemainingSeconds(duration * 60);
      setFocusMessage(sessionMessage("Sessão reiniciada"));
      return;
    }
    void persistProgress("ended", remainingSeconds)
      .then((saved) =>
        setFocusMessage(
          saved
            ? "Tempo feito salvo e somado ao novo bloco."
            : "Sessão reiniciada (menos de 1 minuto não é salvo).",
        ),
      )
      .catch(() => setFocusMessage("Não foi possível salvar agora; o tempo será salvo depois."));
  };

  const endFocus = () => {
    setIsRunning(false);
    setHasStarted(false);
    const realMin = Math.max(1, Math.floor((blockSecondsRef.current - remainingSeconds) / 60));
    if (demo) {
      startedAtRef.current = null;
      addLocalSession("Encerrada", realMin);
      setFocusMessage("Sessão encerrada nesta demonstração. Nada foi salvo.");
      return;
    }
    void persistProgress("ended", remainingSeconds)
      .then((saved) =>
        setFocusMessage(
          saved
            ? "Sessão encerrada e salva no histórico."
            : "Sessão encerrada (menos de 1 minuto não é salvo).",
        ),
      )
      .catch(() =>
        setFocusMessage("Sessão encerrada; o tempo será salvo quando a conexão voltar."),
      );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        showDemoBadge={demo}
        eyebrow="Uma coisa por vez"
        title="Foco"
        description={
          demo
            ? "O temporizador é apenas visual nesta etapa. A ideia é escolher uma tarefa, definir a duração e proteger o bloco."
            : "Escolha uma tarefa real e proteja seu bloco de foco. Sessões encerradas ficam no seu histórico; o bloco em andamento é temporário."
        }
      />

      <DemoNotice />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Sessão atual" description="Escolha a tarefa e a duração planejada.">
          <div className="flex flex-col items-center rounded-xl border border-border/70 bg-secondary/60 px-6 py-10">
            <p className="font-display text-6xl font-semibold tabular-nums tracking-tight">
              {minutes}:{seconds}
            </p>
            <p className="mt-3 max-w-xs break-words text-center text-sm text-muted-foreground">
              {selected ? selected.title : "Nenhuma tarefa selecionada"}
            </p>
            {carriedMinutes > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {carriedMinutes} min já feitos hoje somados a este bloco
              </p>
            ) : null}
            <Progress
              value={
                duration > 0 ? ((duration * 60 - remainingSeconds) / (duration * 60)) * 100 : 0
              }
              className="mt-6 h-1.5 w-full max-w-xs"
            />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                disabled={
                  isRunning ||
                  remainingSeconds === 0 ||
                  (isCustomDuration && !isCustomDurationValid)
                }
                className="bg-gold text-gold-foreground hover:bg-gold/90"
                aria-label="Iniciar sessão de foco"
                onClick={startFocus}
              >
                <Play className="size-4" aria-hidden />
                Iniciar
              </Button>
              <Button
                variant="outline"
                disabled={!isRunning}
                aria-label="Pausar sessão de foco"
                onClick={() => {
                  setIsRunning(false);
                  setFocusMessage(sessionMessage("Sessão pausada"));
                }}
              >
                <Pause className="size-4" aria-hidden />
                Pausar
              </Button>
              <Button
                variant="ghost"
                disabled={isRunning || !hasStarted}
                aria-label="Reiniciar sessão de foco"
                onClick={resetFocus}
              >
                <RotateCcw className="size-4" aria-hidden />
                Reiniciar
              </Button>
            </div>
            {focusMessage ? (
              <p className="mt-4 text-xs text-success" role="status">
                {focusMessage}
              </p>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                {demo
                  ? "O estado desta sessão existe somente nesta demonstração."
                  : "O bloco em andamento é temporário; ao encerrá-lo, salvaremos o histórico da sua conta."}
              </p>
            )}
            <Button
              variant="link"
              size="sm"
              className="mt-2"
              disabled={!hasStarted}
              aria-label="Encerrar sessão de foco"
              onClick={endFocus}
            >
              Encerrar sessão
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tarefa
              </p>
              <Select value={taskId} onValueChange={setTaskId} disabled={isRunning}>
                <SelectTrigger aria-label="Selecionar tarefa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Duração planejada
              </p>
              <div className="grid grid-cols-2 gap-2">
                {durations.map((d) => (
                  <Button
                    key={d}
                    variant={duration === d ? "default" : "outline"}
                    size="sm"
                    disabled={isRunning}
                    onClick={() => {
                      setDurationTouched(true);
                      setIsCustomDuration(false);
                      setDuration(d);
                      if (!isRunning) setRemainingSeconds(d * 60);
                      setFocusMessage(sessionMessage("Duração atualizada"));
                    }}
                    className="min-w-0 flex-1"
                  >
                    {d} min
                  </Button>
                ))}
                <Button
                  variant={isCustomDuration ? "default" : "outline"}
                  size="sm"
                  disabled={isRunning}
                  aria-label="Selecionar duração personalizada"
                  onClick={() => {
                    setDurationTouched(true);
                    setIsCustomDuration(true);
                    setCustomMinutes(String(duration));
                    if (isCustomDurationValid) setRemainingSeconds(duration * 60);
                    setFocusMessage(sessionMessage("Duração personalizada selecionada"));
                  }}
                  className="min-w-0 flex-1"
                >
                  Personalizado
                </Button>
              </div>
              {isCustomDuration ? (
                <div className="mt-3">
                  <label htmlFor="custom-focus-duration" className="text-xs text-muted-foreground">
                    Minutos (5 a 240)
                  </label>
                  <input
                    id="custom-focus-duration"
                    type="number"
                    min={5}
                    max={240}
                    step={1}
                    inputMode="numeric"
                    value={customMinutes}
                    disabled={isRunning}
                    aria-label="Duração personalizada em minutos"
                    onChange={(event) => {
                      const value = event.target.value;
                      setDurationTouched(true);
                      setCustomMinutes(value);
                      if (
                        Number.isInteger(Number(value)) &&
                        Number(value) >= 5 &&
                        Number(value) <= 240
                      ) {
                        setDuration(Number(value));
                        setRemainingSeconds(Number(value) * 60);
                      }
                      setFocusMessage("");
                    }}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                  {customDurationMessage ? (
                    <p className="mt-1 text-xs text-muted-foreground" role="status">
                      {customDurationMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Histórico de sessões"
          description={
            demo
              ? "Últimas sessões registradas nesta demonstração."
              : "Sessões encerradas são salvas na sua conta. O bloco em andamento permanece apenas nesta visita."
          }
        >
          {historyLoading ? (
            <p className="text-sm text-muted-foreground" role="status">
              Carregando histórico…
            </p>
          ) : historyError ? (
            <div role="alert" className="space-y-3">
              <p className="text-sm text-destructive">{historyError}</p>
              <Button variant="outline" onClick={onRetryHistory}>
                Tentar novamente
              </Button>
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={<Timer className="size-5" />}
              title="Ainda sem sessões"
              description="Quando você concluir um bloco de foco, ele aparece aqui."
            />
          ) : (
            <ul className="divide-y divide-border">
              {history.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">{s.task}</p>
                    <p className="mt-0.5 break-words text-xs text-muted-foreground">
                      {s.date} · {categoryName(s.category)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-success">{s.status}</p>
                    <p className="text-sm tabular-nums">
                      {s.realMin}
                      <span className="text-muted-foreground"> / {s.plannedMin} min</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Sessões mais curtas do que o planejado não são falha: são informação para planejar
            melhor a próxima semana.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
