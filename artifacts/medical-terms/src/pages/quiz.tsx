import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, Trophy, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { cn } from '@/lib/utils';
import { useQuizTerms } from '@/hooks/use-terms';
import { useQueryClient } from '@tanstack/react-query';

// ─── Difficulty / Category selectors ─────────────────────────────────────────
const DIFFICULTIES = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

// ─── Results Screen ───────────────────────────────────────────────────────────
function ResultsScreen({
  score, total, onRestart,
}: { score: number; total: number; onRestart: () => void }) {
  const pct = Math.round((score / total) * 100);
  const isGreat = pct >= 80;
  const isOk = pct >= 50;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', damping: 12 }}
        className={cn(
          'w-24 h-24 rounded-3xl flex items-center justify-center mb-6',
          isGreat ? 'bg-primary/10' : isOk ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'
        )}
      >
        <Trophy className={cn('w-12 h-12', isGreat ? 'text-primary' : isOk ? 'text-amber-500' : 'text-red-500')} />
      </motion.div>

      <h2 className="text-3xl font-bold text-foreground mb-1">
        {pct}%
      </h2>
      <p className="text-muted-foreground font-medium mb-1">
        {score} / {total} correct
      </p>
      <p className="text-lg font-bold text-foreground mt-3 mb-8">
        {isGreat ? '🎉 Excellent work!' : isOk ? '👍 Good effort!' : '📚 Keep studying!'}
      </p>

      <button
        onClick={onRestart}
        className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-4 rounded-2xl text-base shadow-lg"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </button>
    </motion.div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onStart }: { onStart: (count: number, difficulty: string) => void }) {
  const [count, setCount] = useState(10);
  const [diff, setDiff] = useState('');

  return (
    <div className="flex flex-col flex-1 px-5 py-8 gap-6">
      <div className="text-center mb-2">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Pop Quiz</h2>
        <p className="text-muted-foreground text-sm mt-1">Test your medical knowledge</p>
      </div>

      {/* Number of questions */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-sm font-bold mb-3">Number of Questions</p>
        <div className="flex gap-2">
          {[5, 10, 15, 20].map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={cn(
                'flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors',
                count === n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-sm font-bold mb-3">Difficulty</p>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.value}
              onClick={() => setDiff(d.value)}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-colors border',
                diff === d.value
                  ? 'border-primary bg-primary/8 text-primary'
                  : 'border-border bg-secondary/40 text-foreground'
              )}
            >
              {d.label}
              {diff === d.value && <CheckCircle2 className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onStart(count, diff)}
        className="w-full h-14 bg-primary text-primary-foreground font-bold text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 mt-auto"
      >
        Start Quiz <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Quiz Engine ──────────────────────────────────────────────────────────────
function QuizEngine({
  count, difficulty, onFinish,
}: { count: number; difficulty: string; onFinish: (score: number) => void }) {
  const { data: questions = [], isLoading, isError, refetch } = useQuizTerms(count, difficulty || undefined);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  const q = questions[index];

  const handleSelect = useCallback((choice: string) => {
    if (revealed) return;
    setSelected(choice);
    setRevealed(true);
    if (choice === q.correctAnswer) setScore(s => s + 1);
  }, [revealed, q]);

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      onFinish(score + (selected === q.correctAnswer ? 0 : 0)); // score already counted
    } else {
      setIndex(i => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading quiz…</p>
      </div>
    );
  }

  if (isError || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm font-semibold text-center text-muted-foreground">
          {questions.length === 0
            ? 'Not enough terms for this filter. Try a different difficulty.'
            : 'Could not load quiz. Try again.'}
        </p>
        <button onClick={() => refetch()} className="text-sm font-bold text-primary">Retry</button>
      </div>
    );
  }

  const progress = (index / questions.length) * 100;

  return (
    <>
      {/* Progress bar */}
      <div className="px-5 py-3 flex items-center gap-4 border-b border-border bg-background shrink-0">
        <span className="text-sm font-bold whitespace-nowrap">Q {index + 1}/{questions.length}</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="text-sm font-bold text-primary whitespace-nowrap">{score} ✓</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8 pb-32 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1"
          >
            {/* Term */}
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-bold text-foreground tracking-tight mb-3">{q.term}</h2>
              <p className="text-base font-medium text-muted-foreground">Select the correct definition</p>
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
                  <button
                    key={i}
                    onClick={() => handleSelect(choice)}
                    disabled={revealed}
                    className={cn(
                      'w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] flex items-start justify-between gap-3 shadow-sm',
                      styles
                    )}
                  >
                    <span className="font-semibold text-sm leading-relaxed">{choice}</span>
                    {Icon}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button */}
      <div className="absolute bottom-[88px] left-0 right-0 px-5 pointer-events-none">
        <motion.button
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 12 }}
          onClick={handleNext}
          className="w-full h-14 rounded-2xl font-bold text-base bg-primary text-primary-foreground shadow-lg pointer-events-auto"
        >
          {index + 1 >= questions.length ? 'See Results' : 'Next Question'}
        </motion.button>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Quiz() {
  const [phase, setPhase] = useState<'setup' | 'quiz' | 'results'>('setup');
  const [config, setConfig] = useState({ count: 10, difficulty: '' });
  const [finalScore, setFinalScore] = useState(0);
  const qc = useQueryClient();

  const handleStart = (count: number, difficulty: string) => {
    qc.removeQueries({ queryKey: ['quiz'] });
    setConfig({ count, difficulty });
    setPhase('quiz');
  };

  const handleFinish = (score: number) => {
    setFinalScore(score);
    setPhase('results');
  };

  const handleRestart = () => {
    setPhase('setup');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-background relative"
    >
      <TopHeader
        title="Pop Quiz"
        rightAction={
          phase !== 'setup' ? (
            <button
              onClick={handleRestart}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : undefined
        }
      />

      {phase === 'setup' && <SetupScreen onStart={handleStart} />}
      {phase === 'quiz' && (
        <QuizEngine
          count={config.count}
          difficulty={config.difficulty}
          onFinish={handleFinish}
        />
      )}
      {phase === 'results' && (
        <ResultsScreen
          score={finalScore}
          total={config.count}
          onRestart={handleRestart}
        />
      )}
    </motion.div>
  );
}
