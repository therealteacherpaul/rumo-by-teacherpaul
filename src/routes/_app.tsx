import { Navigate, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { AppDataModeProvider } from "@/components/data-mode/AppDataModeProvider";
import { z } from "zod";

export const Route = createFileRoute("/_app")({
  validateSearch: z.object({ mode: z.literal("demo").optional() }),
  component: AppLayout,
});

function AppLayout() {
  const { loading, user } = useAuth();
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const mode = search.includes("mode=demo") ? "demo" : undefined;
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verificando acesso…
      </div>
    );
  if (!user && mode !== "demo") return <Navigate to="/login" replace />;
  return (
    <AppDataModeProvider
      key={mode === "demo" ? "demo" : user!.id}
      mode={mode === "demo" ? "demo" : "authenticated"}
    >
      <AppShell>
        <Outlet />
      </AppShell>
    </AppDataModeProvider>
  );
}
