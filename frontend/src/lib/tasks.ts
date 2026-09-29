import type { Priority, Tab, Task } from "./types";

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
export function addDays(value: string, days: number): string {
  const date = parseDate(value); date.setDate(date.getDate() + days); return localDate(date);
}
export function overdue(task: Task, today: string): boolean {
  return !task.completed && !!task.dueDate && task.dueDate < today;
}
export function belongs(task: Task, tab: Tab, today: string): boolean {
  if (tab === "Completed") return task.completed;
  if (task.completed) return false;
  if (tab === "Today") return task.dueDate === today;
  if (tab === "Upcoming") return !!task.dueDate && task.dueDate > today;
  return true;
}
const rank: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
export function selectTasks(tasks: Task[], tab: Tab, today: string, search: string, priority: Priority | "ALL", recent = new Set<string>()): Task[] {
  const query = search.trim().toLocaleLowerCase();
  const group = (task: Task) => !task.dueDate ? 3 : task.dueDate < today ? 0 : task.dueDate === today ? 1 : 2;
  return tasks.filter(task => (belongs(task, tab, today) || (tab !== "Completed" && recent.has(task.id)))
    && (priority === "ALL" || task.priority === priority)
    && `${task.title}\n${task.description ?? ""}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => {
      if (tab === "Completed") return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
      if (tab === "Upcoming") { const due = (a.dueDate ?? "").localeCompare(b.dueDate ?? ""); if (due) return due; }
      if (tab === "All Tasks") { const difference = group(a) - group(b); if (difference) return difference; }
      return rank[a.priority] - rank[b.priority] || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
    });
}
export function dueLabel(task: Task, today: string): string {
  if (!task.dueDate) return "No due date";
  if (overdue(task, today)) return `Overdue · ${parseDate(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  if (task.dueDate === today) return "Today";
  if (task.dueDate === addDays(today, 1)) return "Tomorrow";
  return parseDate(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
