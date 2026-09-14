import type { ReactNode } from "react";
import { AppDataModeContext, type AppDataMode } from "./data-mode-context";

export function AppDataModeProvider({
  mode,
  children,
}: {
  mode: AppDataMode;
  children: ReactNode;
}) {
  return <AppDataModeContext.Provider value={mode}>{children}</AppDataModeContext.Provider>;
}
