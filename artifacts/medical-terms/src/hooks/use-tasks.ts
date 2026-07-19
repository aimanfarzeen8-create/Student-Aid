import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Task {
  id: number;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string; // YYYY-MM-DD
  dueTime: string | null;
  isCompleted: boolean;
  notes: string | null;
  createdAt: string;
}

export interface CreateTaskInput {
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  dueTime?: string;
  notes?: string;
}

export type UpdateTaskInput = Partial<CreateTaskInput> & { isCompleted?: boolean };

const API_BASE = '/api';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface TaskFilters {
  date?: string;
  from?: string;
  to?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed';
}

export function useTasks(filters: TaskFilters = {}) {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.category) params.set('category', filters.category);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.status) params.set('status', filters.status);

  const queryString = params.toString();

  return useQuery<Task[]>({
    queryKey: ['tasks', filters],
    queryFn: () => apiFetch<Task[]>(`/tasks${queryString ? `?${queryString}` : ''}`),
  });
}

export function useTodayTaskCount() {
  const today = new Date().toISOString().split('T')[0];
  return useQuery<{ total: number; active: number }>({
    queryKey: ['tasks-today-count', today],
    queryFn: async () => {
      const tasks = await apiFetch<Task[]>(`/tasks?date=${today}`);
      return {
        total: tasks.length,
        active: tasks.filter((t) => !t.isCompleted).length,
      };
    },
    refetchInterval: 30_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTaskInput & { id: number }) =>
      apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<Task>(`/tasks/${id}/toggle`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
