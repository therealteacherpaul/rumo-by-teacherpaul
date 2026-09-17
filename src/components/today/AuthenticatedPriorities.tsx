import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useTaskData } from "@/hooks/use-task-data";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Priority = Tables<"priorities">;
export function AuthenticatedPriorities() {
  const { user } = useAuth();
  const taskData = useTaskData();
  const date = new Date().toISOString().slice(0, 10);
  const [items, setItems] = useState<Priority[]>([]);
  const [title, setTitle] = useState("");
  const [taskId, setTaskId] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("priorities")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .order("slot");
    if (queryError) setError("Não foi possível carregar suas prioridades. Tente novamente.");
    else setItems(data ?? []);
    setLoading(false);
  }, [user, date]);
  useEffect(() => {
    setItems([]);
    void load();
    return () => setItems([]);
  }, [load]);
  const save = async () => {
    if (!user || !title.trim()) return setError("Informe o título da prioridade.");
    if (!editing && items.length >= 3)
      return setError("Você já definiu três prioridades para hoje.");
    setError("");
    const slot = editing
      ? (items.find((item) => item.id === editing)?.slot ?? 1)
      : (([1, 2, 3] as number[]).find((n) => !items.some((item) => item.slot === n)) ?? 1);
    const payload = { title: title.trim(), task_id: taskId || null, slot, date, user_id: user.id };
    const result = editing
      ? await supabase.from("priorities").update(payload).eq("id", editing).eq("user_id", user.id)
      : await supabase.from("priorities").insert(payload);
    if (result.error) setError("Não foi possível salvar a prioridade.");
    else {
      setTitle("");
      setTaskId("");
      setEditing(null);
      setMessage("Prioridade salva.");
      void load();
    }
  };
  const toggle = async (item: Priority) => {
    const { error: updateError } = await supabase
      .from("priorities")
      .update({ done: !item.done })
      .eq("id", item.id)
      .eq("user_id", user?.id ?? "");
    if (updateError) setError("Não foi possível atualizar a prioridade.");
    else {
      setItems((current) => current.map((p) => (p.id === item.id ? { ...p, done: !p.done } : p)));
      setMessage(item.done ? "Prioridade reaberta." : "Prioridade concluída.");
    }
  };
  const remove = async (id: string) => {
    const { error: deleteError } = await supabase
      .from("priorities")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id ?? "");
    if (deleteError) setError("Não foi possível remover a prioridade.");
    else setItems((current) => current.filter((p) => p.id !== id));
  };
  if (loading)
    return (
      <SectionCard title="Prioridades de hoje">
        <p className="text-sm text-muted-foreground">Carregando suas prioridades…</p>
      </SectionCard>
    );
  return (
    <SectionCard
      title="Três prioridades do dia"
      description="Se só isso acontecer, o dia já valeu."
    >
      {error && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}{" "}
          <button className="underline" onClick={() => void load()}>
            Tentar novamente
          </button>
        </p>
      )}
      {items.length === 0 && (
        <EmptyState
          icon={<Plus className="size-5" />}
          title="Defina sua primeira prioridade"
          description="Escolha até três resultados que fariam diferença hoje."
        />
      )}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
            <button
              type="button"
              aria-label={
                item.done
                  ? `Reabrir prioridade: ${item.title}`
                  : `Concluir prioridade: ${item.title}`
              }
              onClick={() => void toggle(item)}
            >
              {item.done ? (
                <CheckCircle2 className="size-4 text-success" />
              ) : (
                <Circle className="size-4" />
              )}
            </button>
            <span
              className={`min-w-0 flex-1 break-words text-sm ${item.done ? "line-through opacity-60" : ""}`}
            >
              {item.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar prioridade"
              onClick={() => {
                setEditing(item.id);
                setTitle(item.title);
                setTaskId(item.task_id ?? "");
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remover prioridade"
              onClick={() => void remove(item.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da prioridade"
          aria-label="Título da prioridade"
        />
        <Button onClick={() => void save()}>
          <Plus className="mr-2 size-4" />
          {editing ? "Salvar prioridade" : "Adicionar prioridade"}
        </Button>
      </div>
      {taskData.tasks.length > 0 && (
        <select
          className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          aria-label="Vincular tarefa"
        >
          <option value="">Vincular tarefa (opcional)</option>
          {taskData.tasks
            .filter((t) => !t.archived)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
        </select>
      )}
      {message && (
        <p role="status" className="mt-2 text-xs text-success">
          {message}
        </p>
      )}
      <Link className="mt-3 inline-block text-xs text-muted-foreground underline" to="/tasks">
        Criar tarefa
      </Link>
    </SectionCard>
  );
}
