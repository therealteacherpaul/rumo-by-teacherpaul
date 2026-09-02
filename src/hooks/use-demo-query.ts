import { useQuery } from "@tanstack/react-query";

/**
 * Camada fina sobre o TanStack Query para consumir os dados de exemplo locais.
 *
 * Quando o Supabase for conectado, basta trocar o `loader` por uma chamada real
 * mantendo a mesma assinatura nos componentes.
 */
export function useDemoQuery<T>(key: readonly unknown[], loader: () => T) {
  return useQuery({
    queryKey: ["demo", ...key],
    queryFn: async () => loader(),
    staleTime: Infinity,
  });
}
