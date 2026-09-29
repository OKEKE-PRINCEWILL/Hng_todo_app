"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowUpRight, Check, CheckCheck, Circle, Coffee, ListTodo, LoaderCircle, Plus, RefreshCw, Search, SlidersHorizontal, Sparkles, Sun, X, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import type { Task, Tab, Priority } from "@/lib/types";
import type { TaskInput } from "@/lib/validation";
import { belongs, localDate, overdue, selectTasks } from "@/lib/tasks";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { TaskForm } from "./task-form";
import { TaskCard } from "./task-card";

const tabs: { label: Tab; icon: typeof Sun }[] = [{ label: "Today", icon: Sun }, { label: "Upcoming", icon: CalendarDays }, { label: "All Tasks", icon: ListTodo }, { label: "Completed", icon: CheckCheck }];
const empty: Record<Tab, [string, string]> = {
  Today: ["Nothing due today.", "Enjoy the breathing room. A little space is a good thing."],
  Upcoming: ["A clear horizon.", "No upcoming tasks. Add something when you’re ready."],
  "All Tasks": ["A fresh start.", "You have no active tasks. Make a little room for what matters."],
  Completed: ["Good things take a first step.", "Your completed tasks will find a home here."],
};

export function TaskWorkspace() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tab, setTab] = useState<Tab>("Today");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<Priority | "ALL">("ALL");
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const request = useRef(0);
  const [recent, setRecent] = useState(new Set<string>());
  const [form, setForm] = useState<Task | "new" | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [dismissed, setDismissed] = useState("");

  const refresh = useCallback(async (visible = false) => {
    if (busyRef.current) return;
    const sequence = ++request.current;
    if (visible) setLoading(true);
    try {
      const result = await api<Task[]>();
      if (sequence !== request.current || busyRef.current) return;
      setTasks(result); setRecent(new Set()); setError(""); setToday(localDate());
    } catch (err) {
      if (sequence === request.current) setError(err instanceof Error ? err.message : "Could not load tasks.");
    } finally { if (sequence === request.current) setLoading(false); }
  }, []);
  useEffect(() => {
    setToday(localDate());
    void refresh();
    const interval = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60000);
    const focus = () => { void refresh(); };
    window.addEventListener("focus", focus);
    return () => { clearInterval(interval); window.removeEventListener("focus", focus); };
  }, [refresh]);

  function begin(): boolean {
    if (busyRef.current) return false;
    busyRef.current = true; ++request.current; setBusy(true); setError(""); return true;
  }
  function end() { busyRef.current = false; setBusy(false); setLoading(false); }
  function replace(task: Task) { setTasks(rows => rows.map(row => row.id === task.id ? task : row)); }
  async function save(input: TaskInput) {
    if (!begin()) throw new Error("Please wait for the current change to finish.");
    try {
      const edited = form !== "new" && form !== null;
      const saved = await api<Task>(edited ? `/${form.id}` : "", edited ? "PUT" : "POST", input);
      if (edited) replace(saved); else setTasks(rows => [...rows, saved]);
      setForm(null); setStatus(edited ? "Changes saved." : "Task added. One less thing to keep in your head.");
      if (!edited && !belongs(saved, tab, today)) { setTab("All Tasks"); setRecent(new Set()); setSearch(""); setPriority("ALL"); }
    } finally { end(); }
  }
  async function complete(task: Task) {
    if (!begin()) return;
    const next = !task.completed;
    replace({ ...task, completed: next, completedAt: next ? new Date().toISOString() : null });
    if (next && tab !== "Completed") setRecent(ids => new Set(ids).add(task.id));
    try {
      replace(await api<Task>(`/${task.id}/completion`, "PATCH", { completed: next }));
      setStatus(next ? "Nicely done. Task completed." : "Task reopened.");
    } catch (err) {
      replace(task); setRecent(ids => { const nextIds = new Set(ids); nextIds.delete(task.id); return nextIds; });
      setError(err instanceof Error ? err.message : "Could not update task.");
    } finally { end(); }
  }
  async function subtask(task: Task, id: string, completed: boolean) {
    if (!begin()) return;
    replace({ ...task, subtasks: task.subtasks.map(row => row.id === id ? { ...row, completed } : row) });
    try { replace(await api<Task>(`/${task.id}/subtasks/${id}/completion`, "PATCH", { completed })); }
    catch (err) { replace(task); setError(err instanceof Error ? err.message : "Could not update subtask."); }
    finally { end(); }
  }
  async function remove() {
    if (!deleting || !begin()) return;
    try { await api(`/${deleting.id}`, "DELETE"); setTasks(rows => rows.filter(row => row.id !== deleting.id)); setDeleting(null); setStatus("Task deleted."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete task."); }
    finally { end(); }
  }

  const visible = selectTasks(tasks, tab, today, search, priority, recent);
  const late = tasks.filter(task => overdue(task, today));
  const lateKey = late.map(task => `${task.id}:${task.dueDate}`).sort().join("|");
  const filtered = !!search.trim() || priority !== "ALL";
  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="/" aria-label="My Tasks home"><span className="brand-mark"><Check size={21} strokeWidth={3} /></span>my tasks<span className="brand-dot">.</span></a><span className="header-note"><span />A little more headspace</span></header>
    <main>
      <section className="page-heading"><div><div className="eyebrow"><Sun size={15} />{today ? new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${today}T12:00:00`)) : "YOUR DAY, AT YOUR PACE"}</div><h1>Small steps.<br className="mobile-break" /> Clear mind<span>.</span></h1><p>A simple space for what needs doing. One thing at a time.</p></div><Button className="add-task" onClick={() => setForm("new")} disabled={busy || loading}><Plus size={18} />Add Task</Button></section>
      {late.length > 0 && dismissed !== lateKey && <div className="overdue-banner" role="status"><AlertCircle size={20} /><div><strong>{late.length === 1 ? `“${late[0].title}” is overdue.` : `${late.length} tasks need a little attention.`}</strong><p>Overdue tasks are automatically removed after two full overdue days.</p></div><Button variant="ghost" size="sm" onClick={() => { setTab("All Tasks"); setSearch(""); setPriority("ALL"); setRecent(new Set()); }}>View tasks <ArrowUpRight size={15} /></Button><Button variant="ghost" size="icon" aria-label="Dismiss overdue notification" onClick={() => setDismissed(lateKey)}><X size={16} /></Button></div>}
      <section className="workspace" aria-label="Your tasks">
        <div className="tabs" role="tablist" aria-label="Task views">{tabs.map(({ label, icon: Icon }, index) => <button key={label} id={`tab-${index}`} role="tab" aria-selected={tab === label} aria-controls="task-panel" tabIndex={tab === label ? 0 : -1} className={tab === label ? "active" : ""} onClick={() => { setTab(label); setRecent(new Set()); }} onKeyDown={event => {
          const next = event.key === "ArrowRight" ? (index + 1) % 4 : event.key === "ArrowLeft" ? (index + 3) % 4 : event.key === "Home" ? 0 : event.key === "End" ? 3 : -1;
          if (next >= 0) { event.preventDefault(); setTab(tabs[next].label); setRecent(new Set()); document.getElementById(`tab-${next}`)?.focus(); }
        }}><Icon size={17} />{label}<span className="tab-count">{tasks.filter(task => belongs(task, label, today)).length}</span></button>)}</div>
        <div className="toolbar"><div className="search-field"><Search size={18} /><input aria-label="Search tasks" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={16} /></button>}</div><div className="filter-field"><SlidersHorizontal size={16} /><select aria-label="Filter by priority" value={priority} onChange={e => setPriority(e.target.value as Priority | "ALL")}><option value="ALL">All priorities</option><option value="HIGH">High priority</option><option value="MEDIUM">Medium priority</option><option value="LOW">Low priority</option></select></div><Button variant="ghost" size="icon" aria-label="Refresh tasks" disabled={busy || loading} onClick={() => void refresh(true)}><RefreshCw size={17} className={loading ? "spin" : ""} /></Button></div>
        {error && <div role="alert" className="error-banner"><AlertCircle size={18} /><span>{error}</span><Button variant="outline" size="sm" disabled={busy} onClick={() => void refresh(true)}>Retry</Button></div>}
        <div id="task-panel" role="tabpanel" aria-labelledby={`tab-${tabs.findIndex(item => item.label === tab)}`} className="task-panel" aria-busy={loading}>
          <div className="list-caption"><h2>{tab === "Today" ? "A little focus for today" : tab === "Upcoming" ? "On the horizon" : tab === "Completed" ? "Look at what you’ve done" : "Everything on your mind"}</h2><span>{visible.length} {visible.length === 1 ? "task" : "tasks"}</span></div>
          {loading ? <div className="empty-state" role="status"><LoaderCircle className="spin" size={26} /><p>Making a little space…</p></div> : visible.length ? <div className="task-list">{visible.map(task => <TaskCard key={task.id} task={task} today={today} busy={busy} onComplete={complete} onSubtask={subtask} onEdit={setForm} onDelete={setDeleting} />)}</div> : <div className="empty-state"><div className="empty-art"><span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" /><Coffee size={43} strokeWidth={1.3} /><Sparkles size={20} className="art-spark" /><Circle size={8} className="art-dot" /></div><h3>{error ? "Let’s get you connected." : filtered ? "Nothing matches just yet." : empty[tab][0]}</h3><p>{error ? "Your tasks will appear once the connection is restored." : filtered ? "Try another search or give the filters a little room." : empty[tab][1]}</p>{!error && (filtered ? <Button variant="outline" onClick={() => { setSearch(""); setPriority("ALL"); }}>Clear filters</Button> : <Button variant="outline" onClick={() => setForm("new")} disabled={busy}><Plus size={16} />Add a task</Button>)}</div>}
        </div>
        <div className="workspace-footer"><span><Check size={14} />{loading ? "Connecting…" : error ? "Connection needs attention" : "A place for everything. Room to breathe."}</span><span>{tab === "Completed" ? "Completed tasks stay for 30 days" : "Make space for what matters"}</span></div>
      </section>
      <footer className="page-footer"><span>Less to hold in your head. More room for your day.</span><span>Keep it simple <span className="footer-flower">✳</span></span></footer>
      <div className="sr-only" role="status" aria-live="polite">{status}</div>
    </main>
    <Dialog open={form !== null} onOpenChange={open => { if (!open && !busy) setForm(null); }}><DialogContent onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onPointerDownOutside={event => { if (busy) event.preventDefault(); }}>{form !== null && <TaskForm key={form === "new" ? "new" : form.id} task={form === "new" ? undefined : form} onSave={save} onCancel={() => setForm(null)} />}</DialogContent></Dialog>
    <Dialog open={deleting !== null} onOpenChange={open => { if (!open && !busy) setDeleting(null); }}><DialogContent><DialogTitle className="dialog-title">Delete this task?</DialogTitle><DialogDescription className="dialog-description">“{deleting?.title}” and its subtasks will be permanently removed. This action cannot be undone.</DialogDescription>{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete task"}</Button></div></DialogContent></Dialog>
  </div>;
}
