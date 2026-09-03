import { useQuery } from "@tanstack/react-query";

/**
 * Camada fina sobre o TanStack Query para consumir os dados de exemplo locais.
 *
 * Enquanto os dados forem fixtures síncronas, `initialData` garante que SSR e a
 * primeira renderização do cliente recebam o mesmo snapshot sem estado vazio.
 * Uma futura consulta real pode substituir esta configuração sem alterar os
 * componentes consumidores.
 */
export function useDemoQuery<T>(key: readonly unknown[], loader: () => T) {
  return useQuery({
    queryKey: ["demo", ...key],
    queryFn: loader,
    initialData: loader,
    staleTime: Infinity,
  });
}
