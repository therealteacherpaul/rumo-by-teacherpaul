import { createContext } from "react";

export type AppDataMode = "demo" | "authenticated";

export const AppDataModeContext = createContext<AppDataMode>("authenticated");
