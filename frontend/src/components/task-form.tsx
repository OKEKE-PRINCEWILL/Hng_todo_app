"use client";
import { useState } from "react";
import { Plus, X, LoaderCircle } from "lucide-react";
import type { Task, Priority } from "@/lib/types";
import { taskSchema, type TaskInput } from "@/lib/validation";
import { Button } from "./ui/button";
import { DialogTitle, DialogDescription } from "./ui/dialog";

export function TaskForm({ task, onSave, onCancel }: { task?: Task; onSave: (input: TaskInput) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [subtasks, setSubtasks] = useState((task?.subtasks ?? []).map(s => ({ id: s.id as string | undefined, key: s.id, title: s.title, completed: s.completed })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (saving) return;
    const result = taskSchema.safeParse({ title, description: description || null, dueDate: dueDate || null, priority, subtasks });
    if (!result.success) { setError(result.error.issues[0].message); return; }
    setSaving(true); setError("");
    try { await onSave(result.data); } catch (err) { setError(err instanceof Error ? err.message : "Could not save task."); setSaving(false); }
  }
  return <form onSubmit={submit}>
    <DialogTitle className="dialog-title">{task ? "Edit task" : "A little step forward."}</DialogTitle>
    <DialogDescription className="dialog-description">{task ? "Make room for a change of plan." : "Write it down. Give your mind some breathing room."}</DialogDescription>
    <fieldset disabled={saving} className="form-fields">
      <label htmlFor="task-title">Task title <span className="required">*</span></label>
      <input id="task-title" autoFocus maxLength={150} value={title} onChange={e => setTitle(e.target.value)} placeholder="What would you like to get done?" required />
      <label htmlFor="task-notes">Notes <span className="optional">optional</span></label>
      <textarea id="task-notes" rows={3} maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} placeholder="Anything you want to remember…" />
      <div className="form-row"><div><label htmlFor="due-date">Due date <span className="optional">optional</span></label><input id="due-date" type="date" value={dueDate} onInput={e => setDueDate(e.currentTarget.value)} /></div>
      <div><label htmlFor="priority">Priority</label><select id="priority" value={priority} onChange={e => setPriority(e.target.value as Priority)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div></div>
      <div className="subtask-heading">Subtasks <span className="optional">optional</span></div>
      {subtasks.map((subtask, index) => <div className="subtask-input" key={subtask.key}>
        <input aria-label={`Subtask ${index + 1}`} placeholder="One smaller step" maxLength={150} value={subtask.title} onChange={e => setSubtasks(rows => rows.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} />
        <Button type="button" variant="ghost" size="icon" aria-label={`Remove subtask ${index + 1}`} onClick={() => setSubtasks(rows => rows.filter((_, i) => i !== index))}><X size={17} /></Button>
      </div>)}
      <Button type="button" variant="ghost" size="sm" disabled={subtasks.length >= 100} onClick={() => setSubtasks(rows => [...rows, { id: undefined, key: crypto.randomUUID(), title: "", completed: false }])}><Plus size={16} /> Add subtask</Button>
    </fieldset>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="dialog-actions"><Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button><Button disabled={saving}>{saving && <LoaderCircle size={16} className="spin" />}{saving ? "Saving…" : task ? "Save changes" : "Add task"}</Button></div>
  </form>;
}
