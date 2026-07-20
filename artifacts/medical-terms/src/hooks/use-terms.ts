import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Term {
  id: number;
  term: string;
  pronunciation: string | null;
  definition: string;
  example: string | null;
  category: string;
  difficulty: string;
  isFavorite: boolean;
  isLearned: boolean;
  createdAt: string;
}

export interface TermsFilters {
  search?: string;
  category?: string;
  difficulty?: string;
  favoritesOnly?: boolean;
}

export interface QuizQuestion {
  termId: number;
  term: string;
  correctAnswer: string;
  choices: string[];
}

function buildQuery(filters: TermsFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.favoritesOnly) params.set('favoritesOnly', 'true');
  return params.toString();
}

export function useTerms(filters: TermsFilters = {}) {
  return useQuery<Term[]>({
    queryKey: ['terms', filters],
    queryFn: async () => {
      const qs = buildQuery(filters);
      const r = await fetch(`/api/terms${qs ? `?${qs}` : ''}`);
      if (!r.ok) throw new Error('Failed to fetch terms');
      return r.json();
    },
  });
}

export function useQuizTerms(count = 10, category?: string, difficulty?: string) {
  const params = new URLSearchParams({ count: String(count) });
  if (category) params.set('category', category);
  if (difficulty) params.set('difficulty', difficulty);

  return useQuery<QuizQuestion[]>({
    queryKey: ['quiz', count, category, difficulty],
    queryFn: async () => {
      const r = await fetch(`/api/terms/quiz?${params.toString()}`);
      if (!r.ok) throw new Error('Failed to fetch quiz');
      return r.json();
    },
    staleTime: 0, // always fresh shuffle
    gcTime: 0,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/terms/${id}/favorite`, { method: 'POST' });
      if (!r.ok) throw new Error('Failed to toggle favorite');
      return r.json() as Promise<Term>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terms'] });
    },
  });
}

export function useToggleLearned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/terms/${id}/learned`, { method: 'POST' });
      if (!r.ok) throw new Error('Failed to toggle learned');
      return r.json() as Promise<Term>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terms'] });
    },
  });
}
