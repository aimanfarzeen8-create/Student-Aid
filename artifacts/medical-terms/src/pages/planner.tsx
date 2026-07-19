import React, { useState, useMemo } from 'react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Plus, CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp,
  Calendar, Clock, Tag, AlertCircle, X, BookOpen, Brain,
  FileText, ClipboardList, Loader2,
} from 'lucide-react';
import {
  useTasks, useCreateTask, useToggleTask, useDeleteTask, useUpdateTask,
  type Task, type CreateTaskInput,
} from '@/hooks/use-tasks';

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = ['Study', 'Reading', 'Assessment', 'Review', 'Practice', 'Other'] as const;

const CATEGORY_META: Record<string, { color: string; icon: React.ReactNode }> = {
  Study:      { color: 'bg-teal-100 text-teal-700',    icon: <BookOpen className="w-3 h-3" /> },
  Reading:    { color: 'bg-indigo-100 text-indigo-700', icon: <FileText className="w-3 h-3" /> },
  Assessment: { color: 'bg-rose-100 text-rose-700',    icon: <Brain className="w-3 h-3" /> },
  Review:     { color: 'bg-amber-100 text-amber-700',  icon: <ClipboardList className="w-3 h-3" /> },
  Practice:   { color: 'bg-purple-100 text-purple-700', icon: <Brain className="w-3 h-3" /> },
  Other:      { color: 'bg-slate-100 text-slate-600',  icon: <Tag className="w-3 h-3" /> },
};

const PRIORITY_META = {
  high:   { label: 'High',   color: 'text-rose-600',   dot: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700' },
  medium: { label: 'Medium', color: 'text-amber-600',  dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Low',    color: 'text-teal-600',   dot: 'bg-teal-400',   badge: 'bg-teal-100 text-teal-700' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildWeek(anchor: Date) {
  const days = [];
  const dow = anchor.getDay(); // 0=Sun
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((dow === 0 ? 7 : dow) - 1));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function fmt12(time24: string) {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

// ─── Add / Edit Task Sheet ────────────────────────────────────────────────────

interface TaskFormProps {
  initial?: Task;
  defaultDate: string;
  onClose: () => void;
}

function TaskForm({ initial, defaultDate, onClose }: TaskFormProps) {
  const create = useCreateTask();
  const update = useUpdateTask();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState<string>(initial?.category ?? 'Study');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initial?.priority ?? 'medium');
  const [date, setDate] = useState(initial?.dueDate ?? defaultDate);
  const [time, setTime] = useState(initial?.dueTime ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  const pending = create.isPending || update.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (!date) { setError('Date is required'); return; }

    const payload: CreateTaskInput = {
      title: title.trim(),
      category,
      priority,
      dueDate: date,
      dueTime: time || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch {
      setError('Failed to save task. Please try again.');
    }
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl border-t border-border pb-safe"
      style={{ maxWidth: 430, margin: '0 auto' }}
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted" />
      </div>

      <div className="px-5 py-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{initial ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g. Review Cardiology terms"
              className="w-full rounded-2xl bg-secondary/50 border border-border px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold border transition',
                    category === c
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Priority
            </label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-bold border transition capitalize',
                    priority === p
                      ? p === 'high' ? 'bg-rose-500 text-white border-rose-500'
                        : p === 'medium' ? 'bg-amber-400 text-white border-amber-400'
                        : 'bg-teal-500 text-white border-teal-500'
                      : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={e => { setDate(e.target.value); setError(''); }}
                  className="w-full rounded-2xl bg-secondary/50 border border-border pl-9 pr-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full rounded-2xl bg-secondary/50 border border-border pl-9 pr-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional details…"
              rows={2}
              className="w-full rounded-2xl bg-secondary/50 border border-border px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition active:scale-[0.98]"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? 'Save Changes' : 'Add Task'}
          </button>
        </form>
        <div className="h-6" />
      </div>
    </motion.div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onEdit }: { task: Task; onEdit: (t: Task) => void }) {
  const toggle = useToggleTask();
  const remove = useDeleteTask();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const catMeta = CATEGORY_META[task.category] ?? CATEGORY_META['Other'];
  const priMeta = PRIORITY_META[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      className={cn(
        'bg-card border rounded-2xl shadow-sm overflow-hidden transition-colors',
        task.isCompleted ? 'border-border/50 opacity-70' : 'border-border'
      )}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => toggle.mutate(task.id)}
          disabled={toggle.isPending}
          className="mt-0.5 shrink-0 transition-transform active:scale-90"
        >
          {task.isCompleted
            ? <CheckCircle2 className="w-6 h-6 text-primary" strokeWidth={2} />
            : <Circle className="w-6 h-6 text-muted-foreground/50 hover:text-primary transition-colors" strokeWidth={1.5} />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-semibold text-[15px] leading-tight',
            task.isCompleted && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {task.dueTime && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Clock className="w-3 h-3" />
                {fmt12(task.dueTime)}
              </span>
            )}
            <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide', catMeta.color)}>
              {catMeta.icon} {task.category}
            </span>
            <span className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide', priMeta.badge)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', priMeta.dot)} />
              {priMeta.label}
            </span>
          </div>

          {task.notes && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide notes' : 'Show notes'}
            </button>
          )}

          <AnimatePresence>
            {expanded && task.notes && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden text-xs text-muted-foreground mt-1.5 leading-relaxed"
              >
                {task.notes}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="w-7 h-7 rounded-xl bg-secondary/70 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {confirmDelete ? (
            <button
              onClick={() => remove.mutate(task.id)}
              disabled={remove.isPending}
              className="w-7 h-7 rounded-xl bg-destructive flex items-center justify-center"
            >
              {remove.isPending
                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                : <Trash2 className="w-3.5 h-3.5 text-white" />
              }
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              onBlur={() => setConfirmDelete(false)}
              className="w-7 h-7 rounded-xl bg-secondary/70 flex items-center justify-center hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Filter Chips ─────────────────────────────────────────────────────────────

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-secondary/60 border-transparent text-muted-foreground hover:border-primary/30'
      )}
    >
      {children}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Planner() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toLocalISODate(today), [today]);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const weekDays = useMemo(() => buildWeek(weekAnchor), [weekAnchor]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Sheet state
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Fetch tasks for selected date
  const { data: tasks = [], isLoading, isError } = useTasks({ date: selectedDate });

  // Apply client-side filters
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter === 'active' && t.isCompleted) return false;
      if (statusFilter === 'completed' && !t.isCompleted) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, categoryFilter]);

  // Group by completion
  const activeTasks = filtered.filter(t => !t.isCompleted);
  const completedTasks = filtered.filter(t => t.isCompleted);

  // Stats for selected day
  const totalCount = tasks.length;
  const doneCount = tasks.filter(t => t.isCompleted).length;

  function openAdd() {
    setEditingTask(undefined);
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTask(undefined);
  }

  const isToday = selectedDate === todayStr;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="pb-28 flex flex-col min-h-full"
      >
        <TopHeader title="Planner" />

        {/* ── Calendar Strip ── */}
        <div className="bg-background border-b border-border pt-4 pb-3">
          {/* Month + nav */}
          <div className="flex items-center justify-between px-5 mb-3">
            <span className="text-sm font-bold text-foreground">
              {weekDays[0].toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const d = new Date(weekAnchor);
                  d.setDate(d.getDate() - 7);
                  setWeekAnchor(d);
                }}
                className="w-7 h-7 rounded-xl bg-secondary/70 flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
              >
                ‹
              </button>
              <button
                onClick={() => { setWeekAnchor(new Date(today)); setSelectedDate(todayStr); }}
                className="px-2 h-7 rounded-xl bg-secondary/70 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const d = new Date(weekAnchor);
                  d.setDate(d.getDate() + 7);
                  setWeekAnchor(d);
                }}
                className="w-7 h-7 rounded-xl bg-secondary/70 flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
              >
                ›
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center px-2 gap-1">
            {weekDays.map((d, i) => {
              const ds = toLocalISODate(d);
              const isSelected = ds === selectedDate;
              const isTodayDay = ds === todayStr;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(ds)}
                  className={cn(
                    'flex flex-col items-center justify-center w-11 h-16 rounded-2xl transition-all relative',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : isTodayDay
                        ? 'bg-primary/10 text-primary'
                        : 'bg-transparent text-muted-foreground hover:bg-secondary/50'
                  )}
                >
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider', isSelected ? 'text-primary-foreground/80' : '')}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className={cn('text-base font-bold mt-0.5', isSelected ? 'text-primary-foreground' : isTodayDay ? 'text-primary' : 'text-foreground')}>
                    {d.getDate()}
                  </span>
                  {/* Task dot indicator */}
                  {!isSelected && (
                    <TaskDot date={ds} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Date Header + Stats ── */}
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg leading-tight">
                {isToday ? "Today's Tasks" : weekDays.find(d => toLocalISODate(d) === selectedDate)?.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' }) ?? selectedDate}
              </h2>
              {totalCount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {doneCount} of {totalCount} completed
                  {totalCount > 0 && (
                    <span className="ml-2 font-semibold text-primary">
                      {Math.round((doneCount / totalCount) * 100)}%
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} /> Add
            </button>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(doneCount / totalCount) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="px-5 pt-4 space-y-2">
          {/* Status */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {(['all', 'active', 'completed'] as const).map(s => (
              <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : s === 'active' ? '⏳ Active' : '✅ Done'}
              </Chip>
            ))}
            <div className="w-px bg-border shrink-0 mx-1" />
            {(['all', 'high', 'medium', 'low'] as const).map(p => (
              <Chip key={p} active={priorityFilter === p} onClick={() => setPriorityFilter(p)}>
                {p === 'all' ? 'Any priority' : p === 'high' ? '🔴 High' : p === 'medium' ? '🟡 Medium' : '🟢 Low'}
              </Chip>
            ))}
          </div>
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <Chip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>All categories</Chip>
            {CATEGORIES.map(c => (
              <Chip key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>{c}</Chip>
            ))}
          </div>
        </div>

        {/* ── Task List ── */}
        <div className="px-5 pt-4 space-y-3 flex-1">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Loading tasks…</p>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-12 text-destructive gap-2">
              <AlertCircle className="w-6 h-6" />
              <p className="text-sm font-medium">Couldn't load tasks</p>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-3 text-center"
            >
              <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-sm text-foreground">No tasks here</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {tasks.length === 0
                  ? 'Tap "Add" to schedule something for this day.'
                  : 'No tasks match the current filters.'}
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {activeTasks.map(task => (
              <TaskCard key={task.id} task={task} onEdit={openEdit} />
            ))}
          </AnimatePresence>

          {completedTasks.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2">
                Completed ({completedTasks.length})
              </p>
              <AnimatePresence mode="popLayout">
                {completedTasks.map(task => (
                  <TaskCard key={task.id} task={task} onEdit={openEdit} />
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>

      {/* FAB */}
      <motion.button
        onClick={openAdd}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
        style={{ maxWidth: 'none' }}
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <TaskForm
              initial={editingTask}
              defaultDate={selectedDate}
              onClose={closeForm}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Small task-dot indicator for calendar days
function TaskDot({ date }: { date: string }) {
  const { data: tasks } = useTasks({ date });
  if (!tasks || tasks.length === 0) return null;
  const allDone = tasks.every(t => t.isCompleted);
  return (
    <span className={cn(
      'absolute bottom-1.5 w-1.5 h-1.5 rounded-full',
      allDone ? 'bg-primary/50' : 'bg-primary'
    )} />
  );
}

// Alias for the empty-state icon
const CalendarIcon = Calendar;
