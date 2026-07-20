import React, { useState, useMemo } from 'react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bookmark, CheckCircle2, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerms, useToggleFavorite, useToggleLearned } from '@/hooks/use-terms';
import type { Term } from '@/hooks/use-terms';

const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced'];
const DIFF_LABELS: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const DIFF_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ─── Term Detail Sheet ────────────────────────────────────────────────────────
function TermSheet({ term, onClose }: { term: Term; onClose: () => void }) {
  const favorite = useToggleFavorite();
  const learned = useToggleLearned();

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute inset-0 z-50 bg-background flex flex-col"
    >
      <div className="shrink-0 flex items-center justify-between px-5 h-16 border-b border-border">
        <button onClick={onClose} className="text-sm font-semibold text-primary">← Back</button>
        <div className="flex gap-2">
          <button
            onClick={() => learned.mutate(term.id)}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
              term.isLearned ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => favorite.mutate(term.id)}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
              term.isFavorite ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-secondary text-muted-foreground')}
          >
            <Bookmark className={cn('w-4 h-4', term.isFavorite && 'fill-current')} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
              {term.category}
            </span>
            <span className={cn('px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider', DIFF_COLORS[term.difficulty] ?? DIFF_COLORS.beginner)}>
              {DIFF_LABELS[term.difficulty] ?? term.difficulty}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground leading-tight">{term.term}</h2>
          {term.pronunciation && (
            <p className="text-sm text-muted-foreground mt-1 font-mono">{term.pronunciation}</p>
          )}
        </div>

        {/* Definition */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Definition</p>
          <p className="text-base leading-relaxed text-foreground">{term.definition}</p>
        </div>

        {/* Example */}
        {term.example && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Clinical Example</p>
            <p className="text-sm leading-relaxed text-foreground">{term.example}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Term Card ────────────────────────────────────────────────────────────────
function TermCard({ term, onOpen }: { term: Term; onOpen: () => void }) {
  const favorite = useToggleFavorite();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      onClick={onOpen}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-foreground leading-tight truncate">{term.term}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground">
              {term.category}
            </span>
            <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider', DIFF_COLORS[term.difficulty] ?? DIFF_COLORS.beginner)}>
              {DIFF_LABELS[term.difficulty] ?? term.difficulty}
            </span>
            {term.isLearned && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                Learned
              </span>
            )}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); favorite.mutate(term.id); }}
          className="shrink-0 p-1 -m-1 transition-colors"
        >
          <Bookmark className={cn('w-4.5 h-4.5', term.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground')} />
        </button>
      </div>
      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{term.definition}</p>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Browse() {
  const [search, setSearch] = useState('');
  const [activeDiff, setActiveDiff] = useState('All');
  const [activeCat, setActiveCat] = useState('All');
  const [favOnly, setFavOnly] = useState(false);
  const [selected, setSelected] = useState<Term | null>(null);

  const { data: terms = [], isLoading, isError } = useTerms();

  // Derive category list from actual data
  const categories = useMemo(() => {
    const cats = Array.from(new Set(terms.map(t => t.category))).sort();
    return ['All', ...cats];
  }, [terms]);

  // Client-side filtering for instant response
  const filtered = useMemo(() => {
    return terms.filter(t => {
      if (search && !t.term.toLowerCase().includes(search.toLowerCase()) && !t.definition.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeDiff !== 'All' && t.difficulty !== activeDiff) return false;
      if (activeCat !== 'All' && t.category !== activeCat) return false;
      if (favOnly && !t.isFavorite) return false;
      return true;
    });
  }, [terms, search, activeDiff, activeCat, favOnly]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-background relative"
    >
      <TopHeader
        title="Dictionary"
        rightAction={
          <button
            onClick={() => setFavOnly(v => !v)}
            className={cn('w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
              favOnly ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-secondary text-muted-foreground')}
          >
            <Bookmark className={cn('w-4 h-4', favOnly && 'fill-current')} />
          </button>
        }
      />

      {/* Sticky search + filters */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border pt-3 pb-2 space-y-2">
        <div className="px-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search medical terms…"
              className="w-full bg-secondary/60 border border-transparent focus:border-primary/40 h-11 rounded-2xl pl-11 pr-4 outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Difficulty chips */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 px-4 pb-0.5">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setActiveDiff(d)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0',
                activeDiff === d ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground'
              )}
            >
              {d === 'All' ? 'All Levels' : DIFF_LABELS[d]}
            </button>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 px-4 pb-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border shrink-0 transition-colors',
                activeCat === c
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-transparent text-muted-foreground'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Loading terms…</p>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-2xl px-4 py-3 mx-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium">Could not load terms. Check your connection.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
              </p>
              {favOnly && (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">★ Favorites</span>
              )}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm font-semibold text-muted-foreground">No terms match your filters</p>
                <button
                  onClick={() => { setSearch(''); setActiveDiff('All'); setActiveCat('All'); setFavOnly(false); }}
                  className="text-xs font-bold text-primary"
                >
                  Clear filters
                </button>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {filtered.map(term => (
                <TermCard key={term.id} term={term} onOpen={() => setSelected(term)} />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Term detail sheet */}
      <AnimatePresence>
        {selected && <TermSheet term={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
