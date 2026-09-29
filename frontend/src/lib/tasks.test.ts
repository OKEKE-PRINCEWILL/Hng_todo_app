import { describe, expect, it } from "vitest";
import { addDays, belongs, localDate, overdue, selectTasks } from "./tasks";
import { taskSchema } from "./validation";
import type { Task } from "./types";

const today = "2026-09-28";
const task = (input: Partial<Task> = {}): Task => ({ id: "1", title: "Assignment", description: "Review proofs", dueDate: today, priority: "MEDIUM", completed: false, completedAt: null, createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-01T10:00:00Z", subtasks: [], ...input });
describe("date-only task rules", () => {
  it("uses local calendar date including the final minute of the day", () => {
    expect(localDate(new Date(2026, 8, 28, 23, 59))).toBe(today);
    expect(overdue(task(), localDate(new Date(2026, 8, 28, 23, 59)))).toBe(false);
    expect(overdue(task(), localDate(new Date(2026, 8, 29, 0, 0)))).toBe(true);
    expect(addDays(today, 3)).toBe("2026-10-01");
  });
  it("separates all four tabs", () => {
    expect(belongs(task(), "Today", today)).toBe(true);
    expect(belongs(task({ dueDate: "2026-09-29" }), "Upcoming", today)).toBe(true);
    expect(belongs(task({ dueDate: "2026-09-27" }), "Upcoming", today)).toBe(false);
    for (const tab of ["Today", "Upcoming", "All Tasks"] as const) expect(belongs(task({ completed: true }), tab, today)).toBe(false);
    expect(belongs(task({ completed: true }), "Completed", today)).toBe(true);
    expect(belongs(task({ dueDate: null }), "All Tasks", today)).toBe(true);
    expect(belongs(task({ dueDate: null }), "Today", today)).toBe(false);
    expect(belongs(task({ dueDate: null }), "Upcoming", today)).toBe(false);
  });
});
describe("search, filtering and sorting", () => {
  it("matches title and description without case sensitivity within the selected tab", () => {
    const rows = [task(), task({ id: "2", completed: true })];
    expect(selectTasks(rows, "Today", today, "PROOFS", "ALL").map(t => t.id)).toEqual(["1"]);
    expect(selectTasks(rows, "Completed", today, "assignment", "ALL").map(t => t.id)).toEqual(["2"]);
    expect(selectTasks(rows, "Today", today, "", "HIGH")).toEqual([]);
  });
  it("orders all active tasks by date group then priority", () => {
    const rows = [task({ id: "no-date", dueDate: null, priority: "HIGH" }), task({ id: "today-low", priority: "LOW" }), task({ id: "upcoming", dueDate: "2026-09-29" }), task({ id: "late", dueDate: "2026-09-27" }), task({ id: "today-high", priority: "HIGH" })];
    expect(selectTasks(rows, "All Tasks", today, "", "ALL").map(t => t.id)).toEqual(["late", "today-high", "today-low", "upcoming", "no-date"]);
  });
  it("sorts upcoming by date before priority and completed by newest completion", () => {
    expect(selectTasks([task({ id: "later", dueDate: "2026-10-01", priority: "HIGH" }), task({ id: "sooner", dueDate: "2026-09-29", priority: "LOW" })], "Upcoming", today, "", "ALL").map(t => t.id)).toEqual(["sooner", "later"]);
    expect(selectTasks([task({ id: "older", completed: true, completedAt: "2026-09-26T10:00:00Z" }), task({ id: "newer", completed: true, completedAt: "2026-09-27T10:00:00Z" })], "Completed", today, "", "ALL").map(t => t.id)).toEqual(["newer", "older"]);
  });
  it("keeps an optimistic completion visible only until refresh clears its ID", () => {
    const rows = [task({ completed: true })];
    expect(selectTasks(rows, "Today", today, "", "ALL", new Set(["1"]))).toHaveLength(1);
    expect(selectTasks(rows, "Today", today, "", "ALL")).toHaveLength(0);
  });
});
describe("form validation", () => {
  const valid = { title: "  Read  ", description: null, dueDate: null, priority: "MEDIUM", subtasks: [] };
  it("trims titles and accepts optional dates and subtasks", () => { expect(taskSchema.parse(valid).title).toBe("Read"); });
  it("rejects blank titles, impossible dates and unsupported priorities", () => {
    expect(taskSchema.safeParse({ ...valid, title: " " }).success).toBe(false);
    expect(taskSchema.safeParse({ ...valid, dueDate: "2026-02-30" }).success).toBe(false);
    expect(taskSchema.safeParse({ ...valid, priority: "URGENT" }).success).toBe(false);
  });
});
