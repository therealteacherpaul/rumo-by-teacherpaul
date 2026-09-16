import { createContext } from "react";
import type { TaskData, TaskDraft, WriteResult } from "@/lib/task-data";
export type TaskDataContextValue = TaskData & {
  pending: boolean;
  saving: boolean;
  createCategory: (name: string) => Promise<WriteResult>;
  activateCategory: (id: string) => Promise<WriteResult>;
  saveProject: (name: string, id?: string) => Promise<WriteResult>;
  setProjectActive: (id: string, active: boolean) => Promise<WriteResult>;
  saveTask: (draft: TaskDraft, id?: string) => Promise<WriteResult>;
  setTaskStatus: (id: string, done: boolean) => Promise<WriteResult>;
  archiveTask: (id: string) => Promise<WriteResult>;
};
export const TaskDataContext = createContext<TaskDataContextValue | null>(null);
