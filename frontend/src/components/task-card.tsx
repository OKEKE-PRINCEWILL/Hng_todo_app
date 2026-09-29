"use client";
import { CalendarDays, Pencil, Trash2, AlertCircle, Check } from "lucide-react";
import type { Task } from "@/lib/types";
import { addDays, dueLabel, overdue, parseDate } from "@/lib/tasks";
import { Button } from "./ui/button";

export function TaskCard({ task, today, busy, onComplete, onSubtask, onEdit, onDelete }: {
  task: Task; today: string; busy: boolean;
  onComplete: (task: Task) => void; onSubtask: (task: Task, id: string, completed: boolean) => void;
  onEdit: (task: Task) => void; onDelete: (task: Task) => void;
}) {
  const late = overdue(task, today);
  return <article className={`task-card ${task.completed ? "is-completed" : ""} ${late ? "is-overdue" : ""}`}>
    <input className="task-checkbox" type="checkbox" checked={task.completed} disabled={busy} onChange={() => onComplete(task)} aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`} />
    <div className="task-body"><div className="task-heading"><h3>{task.title}</h3><span className={`priority priority-${task.priority.toLowerCase()}`}><i />{task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}</span></div>
      {task.description && <p className="task-description">{task.description}</p>}
      <div className={`task-meta ${late ? "late" : ""}`}>{task.completed ? <><Check size={14} />Completed {task.completedAt && new Date(task.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</> : <>{late ? <AlertCircle size={14} /> : <CalendarDays size={14} />}{dueLabel(task, today)}</>}</div>
      {!!task.subtasks.length && <div className="subtasks">{task.subtasks.map(subtask => <label key={subtask.id} className={subtask.completed ? "subtask-done" : ""}>
        <input type="checkbox" checked={subtask.completed} disabled={busy || task.completed} onChange={() => onSubtask(task, subtask.id, !subtask.completed)} /><span>{subtask.title}</span>
      </label>)}</div>}
      {late && task.dueDate && <p className="removal-note">Automatically removed {parseDate(addDays(task.dueDate, 3)).toLocaleDateString(undefined, { month: "short", day: "numeric" })}. Complete it or adjust the due date to keep it.</p>}
    </div>
    <div className="task-actions"><Button variant="ghost" size="icon" disabled={busy} onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}><Pencil size={16} /></Button><Button variant="ghost" size="icon" disabled={busy} onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}><Trash2 size={16} /></Button></div>
  </article>;
}
