import { pluralize } from "@/lib/pluralize";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/common/SectionCard";

const suggestedCategories = ["Trabalho", "Estudo", "Pessoal"];

type Category = { id: string; name: string; active: boolean; slot: number };

export function AuthenticatedCategoryStart() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("categories")
      .select("id,name,active,slot")
      .eq("user_id", user.id)
      .order("slot");
    if (queryError) setError("Não foi possível carregar suas categorias. Tente novamente.");
    else setCategories(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (categoryName: string) => {
    if (!user || saving) return;
    const trimmed = categoryName.trim();
    const slot = [1, 2, 3, 4].find(
      (candidate) => !categories.some((item) => item.slot === candidate),
    );
    if (!trimmed || !slot) {
      setError(
        slot
          ? "Informe um nome para a categoria."
          : "Você já atingiu o limite de quatro categorias.",
      );
      return;
    }
    if (
      categories.some(
        (item) => item.name.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
      )
    ) {
      setError("Essa categoria já existe.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const { error: insertError } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name: trimmed, slot });
    if (insertError) setError("Não foi possível criar a categoria. Tente novamente.");
    else {
      setName("");
      setMessage(`Categoria “${trimmed}” criada.`);
      await load();
    }
    setSaving(false);
  };

  const createSuggested = async () => {
    if (!user || saving) return;
    const available = suggestedCategories
      .filter(
        (suggestion) =>
          !categories.some(
            (category) => category.name.toLocaleLowerCase() === suggestion.toLocaleLowerCase(),
          ),
      )
      .slice(0, Math.max(0, 4 - categories.length));
    if (!available.length) return;
    setSaving(true);
    setError("");
    setMessage("");
    const occupied = new Set(categories.map((category) => category.slot));
    const rows = available
      .map((suggestion) => {
        const slot = [1, 2, 3, 4].find((candidate) => !occupied.has(candidate));
        if (!slot) return null;
        occupied.add(slot);
        return { user_id: user.id, name: suggestion, slot };
      })
      .filter((row): row is { user_id: string; name: string; slot: number } => row !== null);
    const { error: insertError } = await supabase.from("categories").insert(rows);
    if (insertError) setError("Não foi possível criar as categorias sugeridas. Tente novamente.");
    else {
      setMessage("Categorias sugeridas criadas.");
      await load();
    }
    setSaving(false);
  };

  return (
    <SectionCard
      title="Comece pelas categorias"
      description="Categorias personalizam o RUMO para as áreas da sua vida e organizam seus projetos e tarefas."
    >
      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Carregando suas categorias…
        </p>
      ) : !categories.length ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Você ainda não tem categorias. Crie a primeira ou escolha sugestões — nada será criado
            sem sua confirmação.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={name}
              maxLength={100}
              aria-label="Nome da nova categoria"
              placeholder="Ex.: Trabalho"
              onChange={(event) => setName(event.target.value)}
            />
            <Button disabled={saving || !name.trim()} onClick={() => void create(name)}>
              Criar categoria
            </Button>
          </div>
          <Button variant="outline" disabled={saving} onClick={() => void createSuggested()}>
            Começar com categorias sugeridas
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {categories.filter((category) => category.active).length}/{categories.length}{" "}
            {pluralize(categories.length, "categoria", "categorias")}
            ativas · limite de 4 personalizadas.
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category.id} className="rounded-full border px-3 py-1 text-sm">
                {category.name}
                {!category.active && " · desativada"}
              </span>
            ))}
          </div>
          {categories.length < 4 && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={name}
                maxLength={100}
                aria-label="Nome da nova categoria"
                placeholder="Adicionar categoria"
                onChange={(event) => setName(event.target.value)}
              />
              <Button disabled={saving || !name.trim()} onClick={() => void create(name)}>
                Criar categoria
              </Button>
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-success">
          {message}
        </p>
      )}
      {!loading && error && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => void load()}>
          Tentar novamente
        </Button>
      )}
    </SectionCard>
  );
}
