import { loadTaskData } from "@/lib/load-task-data";
import { useAuth } from "@/hooks/use-auth";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { TaskData, WriteResult } from "@/lib/task-data";
import {
  USER_CATEGORY_LIMITS,
  validateCategoryActivation,
  validateCategoryCreation,
  validateCategoryDeletion,
  validateCategoryRename,
} from "@/lib/category-limits";
import { TaskDataContext, type TaskDataContextValue } from "./task-data-context";

function readableError(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  // Database guards protect the per-account category limits and task integrity.
  if (message.includes("Active category limit"))
    return `Limite de ${USER_CATEGORY_LIMITS.active} categorias ativas atingido. Arquive uma categoria antes de continuar.`;
  if (message.includes("Category total limit"))
    return `Limite de ${USER_CATEGORY_LIMITS.total} categorias no total atingido. Exclua uma categoria arquivada antes de continuar.`;
  if (message.includes("Archive the category"))
    return "Arquive a categoria antes de excluí-la definitivamente.";
  if (message.includes("Category still has"))
    return "Esta categoria ainda tem itens vinculados. Reative-a ou mova esses itens antes de excluir. Nenhuma tarefa é apagada.";
  if (code === "23505")
    return "Este nome ou posição já está em uso. Atualize os dados e tente novamente.";
  if (code === "23503")
    return "A categoria, projeto ou tarefa não está disponível para sua conta. Atualize os dados.";
  if (code === "23514") return "Confira os campos e os limites de categorias e duração estimada.";
  if (code === "23502" || code === "22P02")
    return "Preencha os campos obrigatórios, como a categoria.";
  if (code === "42501")
    return "Sem permissão para esta operação. Entre novamente e tente outra vez.";
  if (code === "42P01" || code === "PGRST205")
    return "Não foi possível carregar suas listas neste ambiente. Tente novamente mais tarde.";
  return "Não foi possível acessar seus dados. Verifique a conexão e tente novamente.";
}

/** Mounted with a user-specific key; no persisted records enter a shared query cache. */
export function TaskDataProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { signOut } = useAuth();
  const [data, setData] = useState<TaskData | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const alive = useRef(false);
  const busy = useRef(false);
  const reloadSequence = useRef(0);
  const request = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const next = await loadTaskData(userId, controller.signal);
    if (!alive.current || controller.signal.aborted) return;
    setData(next);
  }, [userId]);

  const retry = useCallback(async () => {
    const sequence = ++reloadSequence.current;
    setLoading(true);
    setError("");
    try {
      await load();
    } catch (failure) {
      if (alive.current && sequence === reloadSequence.current) setError(readableError(failure));
    } finally {
      if (alive.current && sequence === reloadSequence.current) setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    alive.current = true;
    void retry();
    return () => {
      alive.current = false;
      reloadSequence.current += 1;
      request.current?.abort();
    };
  }, [retry]);

  async function write(operation: () => PromiseLike<{ error: unknown }>): Promise<WriteResult> {
    if (busy.current || loading || error || !alive.current)
      return { valid: false, reason: "Aguarde a operação atual." };
    busy.current = true;
    setPending(true);
    setError("");
    let saved = false;
    try {
      // Check the current browser session before a pending handler can write as another user.
      const { data: auth, error: authError } = await supabase.auth.getSession();
      if (authError || auth.session?.user.id !== userId || !alive.current)
        throw new Error("Session changed");
      const result = await operation();
      if (result.error) throw result.error;
      saved = true;
      if (!alive.current) return { valid: false, reason: "A sessão foi encerrada." };
      await load();
      return { valid: true };
    } catch (failure) {
      if (!saved) {
        // A rejected write leaves the loaded data intact: report it where it happened
        // and keep the page usable instead of locking every form behind a global error.
        console.error("Task data write failed", failure);
        return { valid: false, reason: readableError(failure) };
      }
      // The write is already committed: clear the submitted form even if refreshing failed.
      // The visible error keeps further writes disabled until the user retries loading.
      if (alive.current)
        setError(
          "Alteração salva, mas a atualização da tela falhou. Use Tentar novamente antes de continuar.",
        );
      return { valid: true };
    } finally {
      busy.current = false;
      if (alive.current) setPending(false);
    }
  }

  const value: TaskDataContextValue | null = data && {
    ...data,
    pending: pending || loading || Boolean(error),
    saving: pending,
    createCategory: (name) => {
      const validation = validateCategoryCreation(data.categories, name);
      if (!validation.valid) return Promise.resolve(validation);
      return write(() =>
        supabase
          .from("categories")
          .insert({ user_id: userId, name: name.trim() })
          .select("id")
          .single(),
      );
    },
    renameCategory: (id, name) => {
      const validation = validateCategoryRename(data.categories, id, name);
      if (!validation.valid) return Promise.resolve(validation);
      return write(() =>
        supabase
          .from("categories")
          .update({ name: name.trim() })
          .eq("user_id", userId)
          .eq("id", id)
          .select("id")
          .single(),
      );
    },
    setCategoryActive: (id, active) => {
      const validation = validateCategoryActivation(data.categories, id, active);
      if (!validation.valid) return Promise.resolve(validation);
      return write(() =>
        supabase
          .from("categories")
          .update({ active })
          .eq("user_id", userId)
          .eq("id", id)
          .select("id")
          .single(),
      );
    },
    deleteCategory: (id) => {
      const validation = validateCategoryDeletion(data.categories, id, {
        tasks: data.tasks.filter((task) => task.category_id === id).length,
        projects: data.projects.filter((project) => project.category_id === id).length,
      });
      if (!validation.valid) return Promise.resolve(validation);
      return write(() =>
        supabase
          .from("categories")
          .delete()
          .eq("user_id", userId)
          .eq("id", id)
          .select("id")
          .single(),
      );
    },
    activateCategory: (id) => {
      const validation = validateCategoryActivation(data.categories, id, true);
      if (!validation.valid) return Promise.resolve(validation);
      return write(() =>
        supabase
          .from("categories")
          .update({ active: true })
          .eq("user_id", userId)
          .eq("id", id)
          .select("id")
          .single(),
      );
    },

    saveProject: (name, id) => {
      if (!name.trim() || name.trim().length > 150)
        return Promise.resolve({
          valid: false,
          reason: "Informe um nome de projeto com até 150 caracteres.",
        });
      return write(() =>
        id
          ? supabase
              .from("projects")
              .update({ name: name.trim() })
              .eq("user_id", userId)
              .eq("id", id)
              .select("id")
              .single()
          : supabase
              .from("projects")
              .insert({ user_id: userId, name: name.trim() })
              .select("id")
              .single(),
      );
    },
    setProjectActive: (id, active) =>
      write(() =>
        supabase
          .from("projects")
          .update({ active })
          .eq("user_id", userId)
          .eq("id", id)
          .select("id")
          .single(),
      ),
    saveTask: (draft, id) => {
      if (!draft.category_id || !data.categories.some((item) => item.id === draft.category_id))
        return Promise.resolve({ valid: false, reason: "Escolha uma categoria para a tarefa." });
      if (
        !draft.title.trim() ||
        !Number.isInteger(draft.estimate_min) ||
        draft.estimate_min < 0 ||
        draft.estimate_min > 2147483647
      )
        return Promise.resolve({
          valid: false,
          reason: "Confira título e duração em minutos inteiros.",
        });
      return write(() =>
        id
          ? supabase
              .from("tasks")
              .update({ ...draft, title: draft.title.trim() })
              .eq("user_id", userId)
              .eq("id", id)
              .select("id")
              .single()
          : supabase
              .from("tasks")
              .insert({ ...draft, title: draft.title.trim(), user_id: userId })
              .select("id")
              .single(),
      );
    },
    setTaskStatus: (id, done) =>
      write(() =>
        supabase
          .from("tasks")
          .update({ status: done ? "Concluída" : "A fazer" })
          .eq("user_id", userId)
          .eq("id", id)
          .select("id")
          .single(),
      ),
    archiveTask: (id) =>
      write(() =>
        supabase
          .from("tasks")
          .update({ archived: true })
          .eq("user_id", userId)
          .eq("id", id)
          .select("id")
          .single(),
      ),
  };

  if (!value)
    return (
      <div className="space-y-3 p-8" role={error ? "alert" : "status"}>
        <p>{loading ? "Carregando seus dados…" : error}</p>
        {!loading && <Button onClick={() => void retry()}>Tentar novamente</Button>}
        <Button
          variant="ghost"
          onClick={async () => {
            const result = await signOut();
            if (result.error) setError(result.error);
          }}
        >
          Sair
        </Button>
      </div>
    );
  return (
    <TaskDataContext.Provider value={value}>
      {error && (
        <div
          role="alert"
          className="m-4 space-y-2 rounded-lg border border-destructive p-4 text-sm"
        >
          <p>{error}</p>
          <Button disabled={pending || loading} onClick={() => void retry()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {children}
    </TaskDataContext.Provider>
  );
}
