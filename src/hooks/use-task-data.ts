import { useContext } from "react";
import { TaskDataContext } from "@/components/tasks/task-data-context";
export function useTaskData() {
  const value = useContext(TaskDataContext);
  if (!value) throw new Error("Dados autenticados indisponíveis fora do provedor.");
  return value;
}
