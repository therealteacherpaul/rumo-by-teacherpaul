import { useContext } from "react";
import { AppDataModeContext } from "@/components/data-mode/data-mode-context";

export function useAppDataMode() {
  return useContext(AppDataModeContext);
}
