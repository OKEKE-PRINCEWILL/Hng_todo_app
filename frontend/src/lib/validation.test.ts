import { afterEach, describe, expect, it, vi } from "vitest";
import { taskSchema } from "./validation";

const task = (dueDate: string) => ({
  title: "Test task",
  description: null,
  dueDate,
  priority: "MEDIUM",
  subtasks: [],
});

afterEach(() => {
  vi.useRealTimers();
});

describe("task due-date validation", () => {
  it("accepts today and future dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 12));

    expect(taskSchema.safeParse(task("2026-09-30")).success).toBe(true);
    expect(taskSchema.safeParse(task("2026-10-01")).success).toBe(true);
  });

  it("rejects a past date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 12));

    const result = taskSchema.safeParse(task("2026-09-29"));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Due date cannot be in the past.");
  });
});
