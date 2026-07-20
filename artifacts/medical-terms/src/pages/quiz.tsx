import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, RotateCcw, Trophy, Loader2,
  AlertCircle, ChevronRight, Sparkles, Lightbulb, X,
  BookOpen, Wand2,
} from 'lucide-react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { cn } from '@/lib/utils';
import { useQuizTerms } from '@/hooks/use-terms';
import { useQueryClient } from '@tanstack/react-query';

// ─── Markdown renderer (lightweight) ─────────────────────────────────────────
function renderMd(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) { nodes.push(<h3 key={k++} className="font-bold text-sm mt-2 mb-0.5">{inlineMd(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith('## '))  { nodes.push(<h2 key={k++} className="font-bold text-base mt-2 mb-1">{inlineMd(line.slice(3))}</h2>); i++; continue; }
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s/, '')); i++; }
      nodes.push(<ul key={k++} className="list-disc list-inside space-y-0.5 my-1 text-sm">{items.map((it, idx) => <li key={idx}>{inlineMd(it)}</li>)}</ul>);
      continue;
    }
    if (line.trim() === '') { nodes.push(<div key={k++} className="h-1.5" />); i++; continue; }
    nodes.push(<p key={k++} className="text-sm leading-relaxed">{inlineMd(line)}</p>);
    i++;
  }
  return nodes;
}
function inlineMd(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    const t = m[0];
    if (t.startsWith('**')) parts.push(<strong key={k++} className="font-bold">{t.slice(2, -2)}</strong>);
    else if (t.startsWith('*')) parts.push(<em key={k++} className="italic">{t.slice(1, -1)}</em>);
    else parts.push(<code key={k++} className="bg-black/10 dark:bg-white/10 px-1 rounded text-[11px] font-mono">{t.slice(1, -1)}</code>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return parts.length ? parts : text;
}

// ─── AI Explain Panel ─────────────────────────────────────────────────────────
interface ExplainPanelProps {
  term: string;
  correctAnswer: string;
  selectedAnswer: string;
  wasCorrect: boolean;
  onClose: () => void;
}

function ExplainPanel({ term, correctAnswer, selectedAnswer, wasCorrect, onClose }: ExplainPanelProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  React.useEffect(() => {
    abortRef.current = new AbortController();
    setContent('');
    setLoading(true);
    setError('');

    (async () => {
      try {
        const r = await fetch('/api/ai/explain-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term, correctAnswer, selectedAnswer, wasCorrect }),
          signal: abortRef.current!.signal,
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const reader = r.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.error) throw new Error(evt.error);
              if (evt.done) { setLoading(false); break; }
              if (evt.content) { accumulated += evt.content; setContent(accumulated); setLoading(false); }
            } catch (e: any) {
              if (e.message !== 'Unexpected end of JSON input') throw e;
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') setError(err.message ?? 'Failed to load explanation.');
        setLoading(false);
      }
    })();

    return () => abortRef.current?.abort();
  }, [term, correctAnswer, selectedAnswer, wasCorrect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-x-0 bottom-0 z-50 bg-background border-t-2 border-primary/30 rounded-t-3xl shadow-2xl"
      style={{ maxHeight: '70%' }}
    >
      {/* Handle + header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">AI Explanation</p>
            <p className="text-[10px] text-muted-foreground">{term}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto px-5 py-4 pb-8" style={{ maxHeight: 'calc(70vh - 80px)' }}>
        {loading && !content && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.span key={i} className="w-2 h-2 rounded-full bg-primary"
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground font-medium">Generating explanation…</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {content && (
          <div className="prose-sm text-foreground space-y-1">
            {renderMd(content)}
            {loading && <span className="inline-block w-1.5 h-4 bg-primary rounded-sm animate-pulse ml-0.5" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────
function ResultsScreen({ score, total, onRestart }: { score: number; total: number; onRestart: () => void }) {
  const pct = Math.round((score / total) * 100);
  const isGreat = pct >= 80, isOk = pct >= 50;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', damping: 12 }}
        className={cn('w-24 h-24 rounded-3xl flex items-center justify-center mb-6',
          isGreat ? 'bg-primary/10' : isOk ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
        <Trophy className={cn('w-12 h-12', isGreat ? 'text-primary' : isOk ? 'text-amber-500' : 'text-red-500')} />
      </motion.div>
      <h2 className="text-3xl font-bold mb-1">{pct}%</h2>
      <p className="text-muted-foreground font-medium">{score} / {total} correct</p>
      <p className="text-lg font-bold mt-3 mb-8">
        {isGreat ? '🎉 Excellent work!' : isOk ? '👍 Good effort!' : '📚 Keep studying!'}
      </p>
      <button onClick={onRestart}
        className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-4 rounded-2xl shadow-lg">
        <RotateCcw className="w-4 h-4" /> Try Again
      </button>
    </motion.div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────
interface SetupConfig { count: number; difficulty: string; aiTopic: string; mode: 'standard' | 'ai'; }

function SetupScreen({ onStart }: { onStart: (cfg: SetupConfig) => void }) {
  const [count, setCount] = useState(10);
  const [diff, setDiff] = useState('');
  const [mode, setMode] = useState<'standard' | 'ai'>('standard');
  const [aiTopic, setAiTopic] = useState('');

  const canStart = mode === 'standard' || (mode === 'ai' && aiTopic.trim().length > 2);

  return (
    <div className="flex flex-col flex-1 px-5 py-6 gap-4 overflow-y-auto pb-28">
      <div className="text-center mb-1">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Pop Quiz</h2>
        <p className="text-muted-foreground text-sm mt-1">Test your medical knowledge</p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-secondary rounded-2xl p-1 gap-1">
        <button onClick={() => setMode('standard')}
          className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all',
            mode === 'standard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
          <BookOpen className="w-3.5 h-3.5" /> From Library
        </button>
        <button onClick={() => setMode('ai')}
          className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all',
            mode === 'ai' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
          <Sparkles className="w-3.5 h-3.5" /> AI Generate
        </button>
      </div>

      {/* Number of questions */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold mb-3">Questions</p>
        <div className="flex gap-2">
          {[5, 10, 15, 20].map(n => (
            <button key={n} onClick={() => setCount(n)}
              className={cn('flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors',
                count === n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Standard mode: difficulty */}
      <AnimatePresence mode="wait">
        {mode === 'standard' && (
          <motion.div key="standard" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-bold mb-3">Difficulty</p>
            <div className="flex flex-col gap-2">
              {[{ value: '', label: 'All Levels' }, { value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }].map(d => (
                <button key={d.value} onClick={() => setDiff(d.value)}
                  className={cn('flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm border transition-colors',
                    diff === d.value ? 'border-primary bg-primary/8 text-primary' : 'border-border bg-secondary/40')}>
                  {d.label}
                  {diff === d.value && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI mode: topic input */}
        {mode === 'ai' && (
          <motion.div key="ai" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="bg-card border border-primary/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold">Medical Topic</p>
            </div>
            <input
              type="text"
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              placeholder="e.g. cardiac arrhythmias, renal physiology…"
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              AI will generate {count} fresh questions on any medical topic — not limited to the library.
            </p>
            {/* Suggested topics */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {['Cardiology', 'Neurology', 'Pharmacology', 'Respiratory', 'Endocrinology', 'Haematology'].map(t => (
                <button key={t} onClick={() => setAiTopic(t)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/8 text-primary hover:bg-primary/15 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => onStart({ count, difficulty: diff, aiTopic: aiTopic.trim(), mode })}
        disabled={!canStart}
        className="w-full h-14 bg-primary text-primary-foreground font-bold text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity mt-auto">
        {mode === 'ai' ? <><Sparkles className="w-4 h-4" /> Generate &amp; Start</> : <>Start Quiz <ChevronRight className="w-5 h-5" /></>}
      </button>
    </div>
  );
}

// ─── Quiz Engine ──────────────────────────────────────────────────────────────
interface QuizQuestion { termId: number; term: string; correctAnswer: string; choices: string[]; }

interface QuizEngineProps {
  count: number;
  difficulty: string;
  mode: 'standard' | 'ai';
  aiTopic: string;
  onFinish: (score: number) => void;
}

function QuizEngine({ count, difficulty, mode, aiTopic, onFinish }: QuizEngineProps) {
  // Standard mode uses the hook; AI mode fetches separately
  const standardQuery = useQuizTerms(count, difficulty || undefined);
  const [aiQuestions, setAiQuestions] = useState<QuizQuestion[] | null>(null);
  const [aiLoading, setAiLoading] = useState(mode === 'ai');
  const [aiError, setAiError] = useState('');

  // Load AI questions on mount
  React.useEffect(() => {
    if (mode !== 'ai') return;
    setAiLoading(true);
    fetch('/api/ai/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: aiTopic, count }),
    })
      .then(r => r.ok ? r.json() : r.json().then((e: any) => { throw new Error(e.error); }))
      .then((qs: QuizQuestion[]) => { setAiQuestions(qs); setAiLoading(false); })
      .catch((e: any) => { setAiError(e.message ?? 'Generation failed'); setAiLoading(false); });
  }, [mode, aiTopic, count]);

  const questions: QuizQuestion[] = mode === 'ai' ? (aiQuestions ?? []) : (standardQuery.data ?? []);
  const isLoading = mode === 'ai' ? aiLoading : standardQuery.isLoading;
  const isError = mode === 'ai' ? !!aiError : standardQuery.isError;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplain, setShowExplain] = useState(false);

  const q = questions[index];

  const handleSelect = useCallback((choice: string) => {
    if (revealed || !q) return;
    setSelected(choice);
    setRevealed(true);
    if (choice === q.correctAnswer) setScore(s => s + 1);
  }, [revealed, q]);

  const handleNext = () => {
    setShowExplain(false);
    if (index + 1 >= questions.length) {
      onFinish(score);
    } else {
      setIndex(i => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
        {mode === 'ai' ? (
          <>
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-bold text-base">Generating your quiz…</p>
              <p className="text-sm text-muted-foreground mt-1">AI is crafting {count} questions on <span className="font-semibold text-primary">{aiTopic}</span></p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-primary"
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading quiz…</p>
          </>
        )}
      </div>
    );
  }

  if (isError || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm font-semibold text-muted-foreground">
          {questions.length === 0
            ? mode === 'ai' ? 'AI could not generate questions. Try a different topic.' : 'Not enough terms for this filter.'
            : aiError || 'Could not load quiz.'}
        </p>
        <button onClick={() => mode === 'ai' ? setAiLoading(true) : standardQuery.refetch()}
          className="text-sm font-bold text-primary">Retry</button>
      </div>
    );
  }

  const progress = (index / questions.length) * 100;

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">
      {/* Progress bar */}
      <div className="px-5 py-3 flex items-center gap-3 border-b border-border shrink-0">
        {mode === 'ai' && (
          <div className="flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold text-primary truncate max-w-[80px]">{aiTopic}</span>
          </div>
        )}
        <span className="text-sm font-bold whitespace-nowrap">Q {index + 1}/{questions.length}</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
        <span className="text-sm font-bold text-primary whitespace-nowrap">{score} ✓</span>
      </div>

      {/* Questions area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-36 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="flex flex-col flex-1">

            {/* Term */}
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">{q.term}</h2>
              <p className="text-sm font-medium text-muted-foreground">Select the correct definition</p>
            </div>

            {/* Choices */}
            <div className="space-y-3">
              {q.choices.map((choice, i) => {
                const isCorrect = choice === q.correctAnswer;
                const isSelected = choice === selected;
                let styles = 'bg-card border-border hover:border-primary/40 text-foreground';
                let Icon: React.ReactNode = null;
                if (revealed) {
                  if (isCorrect) {
                    styles = 'bg-green-50 border-green-500 text-green-900 dark:bg-green-950/40 dark:border-green-600 dark:text-green-100';
                    Icon = <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />;
                  } else if (isSelected) {
                    styles = 'bg-red-50 border-red-500 text-red-900 dark:bg-red-950/40 dark:border-red-600 dark:text-red-100';
                    Icon = <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />;
                  } else {
                    styles = 'bg-card/50 border-border/50 text-muted-foreground opacity-60';
                  }
                } else if (isSelected) {
                  styles = 'bg-primary/10 border-primary text-primary';
                }
                return (
                  <button key={i} onClick={() => handleSelect(choice)} disabled={revealed}
                    className={cn('w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] flex items-start justify-between gap-3 shadow-sm', styles)}>
                    <span className="font-semibold text-sm leading-relaxed">{choice}</span>
                    {Icon}
                  </button>
                );
              })}
            </div>

            {/* AI Explain button */}
            <AnimatePresence>
              {revealed && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowExplain(v => !v)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all',
                      showExplain
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-primary/8 text-primary border-primary/20 hover:bg-primary/15'
                    )}>
                    <Lightbulb className="w-4 h-4" />
                    {showExplain ? 'Hide Explanation' : 'Explain with AI'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button */}
      <div className="absolute bottom-[88px] left-0 right-0 px-5 pointer-events-none z-10">
        <motion.button animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 12 }}
          onClick={handleNext}
          className="w-full h-14 rounded-2xl font-bold text-base bg-primary text-primary-foreground shadow-lg pointer-events-auto">
          {index + 1 >= questions.length ? 'See Results' : 'Next Question'}
        </motion.button>
      </div>

      {/* AI Explain panel */}
      <AnimatePresence>
        {showExplain && q && (
          <ExplainPanel
            term={q.term}
            correctAnswer={q.correctAnswer}
            selectedAnswer={selected ?? ''}
            wasCorrect={selected === q.correctAnswer}
            onClose={() => setShowExplain(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Quiz() {
  const [phase, setPhase] = useState<'setup' | 'quiz' | 'results'>('setup');
  const [config, setConfig] = useState<SetupConfig>({ count: 10, difficulty: '', aiTopic: '', mode: 'standard' });
  const [finalScore, setFinalScore] = useState(0);
  const qc = useQueryClient();

  interface SetupConfig { count: number; difficulty: string; aiTopic: string; mode: 'standard' | 'ai'; }

  const handleStart = (cfg: SetupConfig) => {
    qc.removeQueries({ queryKey: ['quiz'] });
    setConfig(cfg);
    setPhase('quiz');
  };

  const handleFinish = (score: number) => { setFinalScore(score); setPhase('results'); };
  const handleRestart = () => setPhase('setup');

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full bg-background relative">
      <TopHeader
        title="Pop Quiz"
        rightAction={phase !== 'setup' ? (
          <button onClick={handleRestart} className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <RotateCcw className="w-4 h-4" />
          </button>
        ) : undefined}
      />
      {phase === 'setup' && <SetupScreen onStart={handleStart} />}
      {phase === 'quiz' && (
        <QuizEngine
          count={config.count}
          difficulty={config.difficulty}
          mode={config.mode}
          aiTopic={config.aiTopic}
          onFinish={handleFinish}
        />
      )}
      {phase === 'results' && <ResultsScreen score={finalScore} total={config.count} onRestart={handleRestart} />}
    </motion.div>
  );
}
