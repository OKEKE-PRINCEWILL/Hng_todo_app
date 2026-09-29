export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Tab = "Today" | "Upcoming" | "All Tasks" | "Completed";
export interface Subtask {
  id: string; taskId: string; title: string; completed: boolean; createdAt: string; updatedAt: string;
}
export interface Task {
  id: string; title: string; description: string | null; dueDate: string | null;
  priority: Priority; completed: boolean; completedAt: string | null;
  createdAt: string; updatedAt: string; subtasks: Subtask[];
}
