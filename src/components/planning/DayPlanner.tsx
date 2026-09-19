import { pluralize } from "@/lib/pluralize";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { planningService } from "@/lib/ai/planning-service";
import { analyzePlanningInput } from "@/lib/ai/planning-analysis";
import {
  PlanningError,
  type PlanningInput,
  type PlanningOptions,
  type PlanningSuggestion,
} from "@/lib/ai/planning-types";

type Decision = { status: "accepted" | "ignored"; minutes: number };
type Review = { id: string; title: string; reason: string; minutes: string; max: number };
export function DayPlanner({
  input,
  mode,
  unavailable = false,
}: {
  input: PlanningInput;
  mode: PlanningOptions["mode"];
  unavailable?: boolean;
}) {
  const [available, setAvailable] = useState(String(input.availableMinutes));
  const [plan, setPlan] = useState<PlanningSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [reviewError, setReviewError] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const request = useRef<AbortController | null>(null);
  const minutes = Number(available);
  const valid =
    available.trim() !== "" && Number.isInteger(minutes) && minutes >= 5 && minutes <= 1440;
  const current = { ...input, availableMinutes: minutes };
  const analysis = valid ? analyzePlanningInput(current) : null;
  useEffect(() => () => request.current?.abort(), []);

  async function generate() {
    if (!valid || unavailable || !input.tasks.length || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    setPlan(null);
    setDecisions({});
    setMessage("");
    setReview(null);
    try {
      const next = await planningService.generatePlan(current, { mode, signal: controller.signal });
      if (!controller.signal.aborted) setPlan(next);
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof PlanningError
            ? failure.message
            : "Não foi possível gerar o plano. Tente novamente; seus dados não foram alterados.",
        );
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
  }
  function changeAvailable(value: string) {
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setAvailable(value);
    setPlan(null);
    setDecisions({});
    setReview(null);
    setError("");
    setMessage("Tempo atualizado. Gere um novo plano para usar esse limite.");
  }
  function decide(id: string, status: Decision["status"], duration: number) {
    const block = plan?.suggestedBlocks.find((item) => item.id === id);
    const acceptedMinutes =
      plan?.suggestedBlocks.reduce(
        (sum, item) =>
          sum +
          (item.id !== id && decisions[item.id]?.status === "accepted"
            ? decisions[item.id]!.minutes
            : 0),
        0,
      ) ?? 0;
    if (status === "accepted" && block && acceptedMinutes + duration > minutes) {
      setReviewError(
        "Os blocos aceitos ultrapassariam seu tempo disponível. Reduza a duração ou ignore outro bloco.",
      );
      setMessage(
        "Os blocos aceitos ultrapassariam seu tempo disponível. Reduza a duração ou ignore outro bloco.",
      );
      return false;
    }
    setDecisions((previous) => ({ ...previous, [id]: { status, minutes: duration } }));
    setMessage(
      status === "accepted"
        ? "Sugestão aceita apenas no rascunho desta visita. Nenhuma tarefa ou prioridade foi alterada."
        : "Sugestão ignorada. Seus dados permanecem iguais.",
    );
    return true;
  }
  const reviewValid =
    review &&
    review.minutes.trim() !== "" &&
    Number.isInteger(Number(review.minutes)) &&
    Number(review.minutes) >= 1 &&
    Number(review.minutes) <= review.max;
  return (
    <section aria-label="Planejador do dia" className="min-w-0">
      <SectionCard
        title="Planejador do dia"
        description="Veja o que cabe hoje e revise as sugestões antes de decidir."
      >
        <p className="mb-4 text-sm text-muted-foreground">
          {mode === "demo"
            ? "Prévia de demonstração: sugestões calculadas localmente com exemplos, sem chamadas de IA ou gravações."
            : "As sugestões são geradas por IA a partir dos seus dados e nada é alterado automaticamente. As verificações abaixo usam regras locais."}
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Aceitar guarda apenas um rascunho nesta visita. Sair, recarregar ou regenerar descarta as
          decisões. Nenhum prazo, tarefa ou hábito será alterado automaticamente.
        </p>
        {unavailable ? (
          <p role="alert">
            As prioridades não puderam ser carregadas. Use “Tentar novamente” na seção de
            prioridades para planejar com dados completos.
          </p>
        ) : !input.tasks.length ? (
          <div className="space-y-3">
            <p>
              {input.priorities.length || input.habits.length
                ? "Você já tem prioridades ou hábitos para considerar. Adicione uma tarefa aberta para sugerir blocos de foco."
                : "Comece com uma tarefa pequena. Depois podemos comparar seu prazo e duração com o tempo disponível."}
            </p>
            <Button asChild>
              <Link to="/tasks" search={mode === "demo" ? { mode: "demo" } : {}}>
                Criar primeira tarefa
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="grid min-w-0 gap-2 text-sm">
                Tempo disponível hoje (minutos)
                <Input
                  type="number"
                  min={5}
                  max={1440}
                  step={1}
                  value={available}
                  onChange={(e) => changeAvailable(e.target.value)}
                  aria-invalid={!valid}
                  aria-describedby="planning-time-help"
                />
              </label>
              <Button onClick={() => void generate()} disabled={!valid || loading}>
                {loading ? "Analisando o dia…" : plan ? "Regenerar sugestões" : "Gerar sugestões"}
              </Button>
            </div>
            <p id="planning-time-help" className="mt-2 text-xs text-muted-foreground">
              {valid
                ? "Informe o tempo livre depois de compromissos fixos. Limite: 5 a 1440 minutos."
                : "Informe um número inteiro entre 5 e 1440 minutos."}
            </p>
            {loading && (
              <p role="status" className="mt-3 text-sm">
                Preparando sugestões… Você pode continuar usando o RUMO.
              </p>
            )}
            {error && (
              <div
                role="alert"
                className="mt-4 space-y-3 rounded-lg border border-destructive/40 p-3 text-sm"
              >
                <p>{error}</p>
                <Button
                  variant="outline"
                  onClick={() => void generate()}
                  disabled={loading || !valid}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            {analysis && (
              <div className="mt-5 space-y-3">
                <h3 className="font-medium">Verificações locais</h3>
                <p className="text-sm text-muted-foreground">
                  {input.tasks.length}{" "}
                  {pluralize(input.tasks.length, "tarefa aberta", "tarefas abertas")} ·{" "}
                  {input.projects.length} {pluralize(input.projects.length, "projeto", "projetos")}{" "}
                  · {input.priorities.length}{" "}
                  {pluralize(input.priorities.length, "prioridade aberta", "prioridades abertas")} ·{" "}
                  {input.habits.length}{" "}
                  {pluralize(input.habits.length, "hábito ativo", "hábitos ativos")}.
                </p>
                <p className="text-sm">
                  Tarefas com estimativa: {analysis.taskMinutes} min. Hábitos com meta de tempo:{" "}
                  {analysis.habitMinutes} min. Sem estimativa: {analysis.unestimated}{" "}
                  {pluralize(analysis.unestimated, "tarefa", "tarefas")}.
                </p>
                <p className="text-xs text-muted-foreground">
                  {mode === "demo"
                    ? "Hábitos refletem suas edições nesta sessão de demonstração."
                    : "Hábitos ativos são carregados da sua conta."}
                </p>
                {analysis.warnings.length ? (
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    {analysis.warnings.map((warning, index) => (
                      <li key={index} className="break-words">
                        {warning}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">
                    Nenhum alerta pelas regras de prazo, estimativa e capacidade. Reserve também
                    tempo para pausas.
                  </p>
                )}
              </div>
            )}
            {plan && (
              <div className="mt-6 space-y-4" aria-label="Sugestões do planejador">
                <h3 className="font-medium">
                  {plan.source === "demo" ? "Exemplo de plano — sem IA" : "Plano sugerido pela IA"}
                </h3>
                <p className="break-words text-sm">{plan.summary}</p>
                {!!plan.warnings.length && (
                  <details className="text-sm">
                    <summary className="cursor-pointer">
                      Alertas do plano ({plan.warnings.length})
                    </summary>
                    <ul className="mt-2 list-disc space-y-2 pl-5">
                      {plan.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <ol className="space-y-3">
                  {[
                    ...plan.suggestedBlocks.map((block, index) => ({
                      ...block,
                      label: `${index + 1}. ${block.title}`,
                      max: minutes,
                    })),
                    ...plan.proposedChanges.map((change) => ({
                      ...change,
                      label: `Revisar estimativa: ${input.tasks.find((t) => t.id === change.taskId)?.title ?? "Tarefa"}`,
                      max: 1440,
                    })),
                  ].map((item) => {
                    const decision = decisions[item.id];
                    const task = input.tasks.find((t) => t.id === item.taskId);
                    const project = input.projects.find((p) => p.id === task?.projectId);
                    return (
                      <li key={item.id} className="min-w-0 space-y-2 rounded-lg border p-3">
                        <h4 className="break-words text-sm font-medium">{item.label}</h4>
                        <p className="text-sm">
                          {decision?.minutes ?? item.minutes} min · {project?.name ?? "Sem projeto"}
                        </p>
                        <p className="break-words text-sm text-muted-foreground">{item.reason}</p>
                        {decision && (
                          <p className="text-xs font-medium">
                            {decision.status === "accepted" ? "Aceita no rascunho" : "Ignorada"}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={decision?.status === "accepted"}
                            aria-label={`Aceitar ${item.label}`}
                            onClick={() =>
                              decide(item.id, "accepted", decision?.minutes ?? item.minutes)
                            }
                          >
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={decision?.status === "ignored"}
                            aria-label={`Ignorar ${item.label}`}
                            onClick={() =>
                              decide(item.id, "ignored", decision?.minutes ?? item.minutes)
                            }
                          >
                            Ignorar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Revisar ${item.label}`}
                            onClick={() => {
                              setReviewError("");
                              setReview({
                                id: item.id,
                                title: item.label,
                                reason: item.reason,
                                minutes: String(decision?.minutes ?? item.minutes),
                                max: item.max,
                              });
                            }}
                          >
                            Revisar antes de aceitar
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
            {message && (
              <p role="status" className="mt-3 text-sm">
                {message}
              </p>
            )}
          </>
        )}
      </SectionCard>
      <Dialog
        open={Boolean(review)}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar sugestão</DialogTitle>
            <DialogDescription>
              Ajuste o tempo e confirme somente no rascunho. Isso não altera os registros da sua
              conta.
            </DialogDescription>
          </DialogHeader>
          {review && (
            <div className="space-y-4">
              <p className="break-words font-medium">{review.title}</p>
              <p className="text-sm">{review.reason}</p>
              <label className="grid gap-2 text-sm">
                Duração sugerida (minutos)
                <Input
                  type="number"
                  min={1}
                  max={review.max}
                  value={review.minutes}
                  onChange={(e) => {
                    setReviewError("");
                    setReview({ ...review, minutes: e.target.value });
                  }}
                  aria-invalid={!reviewValid}
                />
              </label>
              {reviewError && (
                <p role="alert" className="text-sm">
                  {reviewError}
                </p>
              )}
              {!reviewValid && (
                <p role="alert" className="text-sm">
                  Informe entre 1 e {review.max} minutos inteiros.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!reviewValid}
                  onClick={() => {
                    if (decide(review.id, "accepted", Number(review.minutes))) setReview(null);
                  }}
                >
                  Confirmar no rascunho
                </Button>
                <Button variant="outline" onClick={() => setReview(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
