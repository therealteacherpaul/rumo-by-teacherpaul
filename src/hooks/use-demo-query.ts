import { type DefinedUseQueryResult, useQuery } from "@tanstack/react-query";
import { useAppDataMode } from "@/hooks/use-app-data-mode";

/**
 * Camada fina sobre o TanStack Query para consumir os dados de exemplo locais.
 *
 * Enquanto os dados forem fixtures síncronas, `initialData` garante que SSR e a
 * primeira renderização do cliente recebam o mesmo snapshot sem estado vazio.
 * Uma futura consulta real pode substituir esta configuração sem alterar os
 * componentes consumidores.
 */
export function useDemoQuery<T extends object>(
  key: readonly unknown[],
  loader: () => T,
): DefinedUseQueryResult<T> {
  const mode = useAppDataMode();
  return useQuery({
    queryKey: ["demo", ...key],
    queryFn: loader,
    enabled: mode === "demo",
    initialData: mode === "demo" ? loader() : undefined,
    staleTime: Infinity,
  }) as DefinedUseQueryResult<T>;
}
