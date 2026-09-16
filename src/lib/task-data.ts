import type { Tables } from "@/integrations/supabase/types";
import type { Task } from "@/lib/demo-data";

// Reuse the existing database IDs and generated record types without converting them.
export type UserCategory = Tables<"categories">;
export type UserProject = Tables<"projects">;
export type UserTask = Tables<"tasks">;
export type TaskPriority = Task["priority"];
export type TaskStatus = Task["status"];
export type TaskDraft = Pick<
  UserTask,
  "title" | "category_id" | "project_id" | "priority" | "due_date" | "estimate_min" | "status"
>;
export type TaskData = { categories: UserCategory[]; projects: UserProject[]; tasks: UserTask[] };
export type WriteResult = { valid: true } | { valid: false; reason: string };
