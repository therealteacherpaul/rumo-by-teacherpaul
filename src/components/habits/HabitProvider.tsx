import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAppDataMode } from "@/hooks/use-app-data-mode";
import { DemoHabitProvider } from "./DemoHabitProvider";
import { AuthenticatedHabitProvider } from "./AuthenticatedHabitProvider";

export function HabitProvider({ children }: { children: ReactNode }) {
  const mode = useAppDataMode();
  const { user } = useAuth();
  if (mode === "demo") return <DemoHabitProvider key="demo">{children}</DemoHabitProvider>;
  if (!user) return null;
  return (
    <AuthenticatedHabitProvider key={user.id} userId={user.id}>
      {children}
    </AuthenticatedHabitProvider>
  );
}
