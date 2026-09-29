import { z } from "zod";
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
  .refine(value => { const parsed = new Date(`${value}T00:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }, "Choose a valid date.");
export const taskSchema = z.object({
  title: z.string().trim().min(1, "Give your task a title.").max(150),
  description: z.string().max(1000).nullable(), dueDate: date.nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  subtasks: z.array(z.object({ id: z.string().optional(), title: z.string().trim().min(1, "Subtasks need a title.").max(150), completed: z.boolean() })).max(100),
});
export type TaskInput = z.infer<typeof taskSchema>;
