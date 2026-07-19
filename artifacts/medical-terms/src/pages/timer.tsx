import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Play, Pause, RotateCcw, SkipForward,
  Brain, Zap, BookOpen, Wind, Clock, Sliders,
  ChevronRight, CheckCircle2, Flame,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'focus' | 'shortBreak' | 'longBreak';
type Status = 'idle' | 'running' | 'paused';

interface Template {
  id: string;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  focusMins: number;
  shortBreakMins: number;
  longBreakMins: number;
  sessionsPerCycle: number;
  gradient: string;        // Tailwind gradient classes
  ringColor: string;       // hex for SVG stroke
  ringTrack: string;       // hex for SVG track
  btnBg: string;           // Tailwind class for play btn
  badgeBg: string;         // Tailwind pill bg
  breathe?: boolean;       // animate breathing on breaks
  tips: string[];
}

// ─── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    tagline: 'Classic 25 · 5 rhythm',
    icon: <Brain className="w-5 h-5" />,
    focusMins: 25,
    shortBreakMins: 5,
    longBreakMins: 15,
    sessionsPerCycle: 4,
    gradient: 'from-indigo-500 to-violet-600',
    ringColor: '#6366f1',
    ringTrack: '#e0e7ff',
    btnBg: 'bg-indigo-500 hover:bg-indigo-600',
    badgeBg: 'bg-indigo-100 text-indigo-700',
    tips: [
      'Turn on Do Not Disturb before each session.',
      'Write down distractions instead of acting on them.',
      'Stand up and stretch during every break.',
      'After 4 pomodoros, step outside for fresh air.',
    ],
  },
  {
    id: 'deep',
    name: 'Deep Study',
    tagline: 'Long focus, full recovery',
    icon: <BookOpen className="w-5 h-5" />,
    focusMins: 50,
    shortBreakMins: 10,
    longBreakMins: 25,
    sessionsPerCycle: 3,
    gradient: 'from-teal-500 to-cyan-600',
    ringColor: '#0d9488',
    ringTrack: '#ccfbf1',
    btnBg: 'bg-teal-600 hover:bg-teal-700',
    badgeBg: 'bg-teal-100 text-teal-700',
    tips: [
      'Close all unrelated browser tabs before you start.',
      'Keep water at your desk — hydration aids cognition.',
      'Review what you just studied right after each break.',
      'Aim for 3 deep blocks per day maximum.',
    ],
  },
  {
    id: 'calm',
    name: 'Calm Study',
    tagline: 'Gentle pacing + breathing',
    icon: <Wind className="w-5 h-5" />,
    focusMins: 30,
    shortBreakMins: 8,
    longBreakMins: 20,
    sessionsPerCycle: 3,
    gradient: 'from-emerald-400 to-green-600',
    ringColor: '#10b981',
    ringTrack: '#d1fae5',
    btnBg: 'bg-emerald-500 hover:bg-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    breathe: true,
    tips: [
      'Breathe in 4 counts, hold 4, out 4 during breaks.',
      'Dim your screen and lower the room lights slightly.',
      'Write brief notes by hand — it aids memory consolidation.',
      'Finish each session by noting one thing you learned.',
    ],
  },
  {
    id: 'power',
    name: 'Power Hour',
    tagline: 'High intensity, full hour',
    icon: <Zap className="w-5 h-5" />,
    focusMins: 60,
    shortBreakMins: 15,
    longBreakMins: 30,
    sessionsPerCycle: 2,
    gradient: 'from-amber-400 to-orange-500',
    ringColor: '#f59e0b',
    ringTrack: '#fef3c7',
    btnBg: 'bg-amber-500 hover:bg-amber-600',
    badgeBg: 'bg-amber-100 text-amber-700',
    tips: [
      'Only attempt Power Hour after you\'re already warm.',
      'Have all materials ready before the timer starts.',
      'Treat the break as sacred — no phone.',
      'Power Hour is best for single-topic deep dives.',
    ],
  },
  {
    id: 'sprint',
    name: 'Quick Sprint',
    tagline: 'Fast review sessions',
    icon: <Flame className="w-5 h-5" />,
    focusMins: 15,
    shortBreakMins: 3,
    longBreakMins: 10,
    sessionsPerCycle: 5,
    gradient: 'from-rose-500 to-pink-600',
    ringColor: '#f43f5e',
    ringTrack: '#ffe4e6',
    btnBg: 'bg-rose-500 hover:bg-rose-600',
    badgeBg: 'bg-rose-100 text-rose-700',
    tips: [
      'Great for flashcard review or MCQ practice.',
      'Keep each sprint to one topic only.',
      'Use short breaks to recall what you just covered.',
      '5 sprints = 1.25 h of active review.',
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    tagline: 'Your own schedule',
    icon: <Sliders className="w-5 h-5" />,
    focusMins: 25,
    shortBreakMins: 5,
    longBreakMins: 15,
    sessionsPerCycle: 4,
    gradient: 'from-slate-500 to-slate-700',
    ringColor: '#64748b',
    ringTrack: '#e2e8f0',
    btnBg: 'bg-slate-600 hover:bg-slate-700',
    badgeBg: 'bg-slate-100 text-slate-600',
    tips: [
      'Experiment until you find your personal rhythm.',
      'Start conservative — you can always shorten breaks.',
      'Track which durations you actually stick to.',
    ],
  },
];

// ─── Audio ────────────────────────────────────────────────────────────────────

function playTone(type: 'start' | 'end' | 'tick') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'end') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.30);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
    } else if (type === 'start') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.10, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch {
    // Audio not available — silently skip
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function phaseLabel(phase: Phase, breathe?: boolean) {
  if (phase === 'focus') return 'Focus Session';
  if (breathe) return phase === 'shortBreak' ? 'Breathe & Rest' : 'Deep Rest';
  return phase === 'shortBreak' ? 'Short Break' : 'Long Break';
}

function phaseDuration(t: Template, phase: Phase) {
  if (phase === 'focus') return t.focusMins * 60;
  if (phase === 'shortBreak') return t.shortBreakMins * 60;
  return t.longBreakMins * 60;
}

// ─── Custom Editor ────────────────────────────────────────────────────────────

interface CustomEditorProps {
  template: Template;
  onSave: (t: Template) => void;
  onCancel: () => void;
}

function CustomEditor({ template, onSave, onCancel }: CustomEditorProps) {
  const [focus, setFocus] = useState(template.focusMins);
  const [short, setShort] = useState(template.shortBreakMins);
  const [long, setLong] = useState(template.longBreakMins);
  const [cycles, setCycles] = useState(template.sessionsPerCycle);

  function NumInput({ label, value, onChange, min, max }: {
    label: string; value: number; onChange: (v: number) => void; min: number; max: number;
  }) {
    return (
      <div className="flex items-center justify-between bg-secondary/60 rounded-2xl px-4 py-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center text-lg font-bold text-muted-foreground active:scale-90 transition-transform"
          >−</button>
          <span className="text-base font-bold w-8 text-center tabular-nums">{value}</span>
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center text-lg font-bold text-muted-foreground active:scale-90 transition-transform"
          >+</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl border-t border-border"
      style={{ maxWidth: 430, margin: '0 auto' }}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted" />
      </div>
      <div className="px-5 py-3 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Custom Timer</h2>
          <button onClick={onCancel} className="text-xs font-semibold text-muted-foreground px-3 py-1.5 bg-secondary rounded-xl">Cancel</button>
        </div>
        <div className="space-y-3">
          <NumInput label="Focus (mins)" value={focus} onChange={setFocus} min={1} max={120} />
          <NumInput label="Short break (mins)" value={short} onChange={setShort} min={1} max={30} />
          <NumInput label="Long break (mins)" value={long} onChange={setLong} min={5} max={60} />
          <NumInput label="Sessions per cycle" value={cycles} onChange={setCycles} min={1} max={8} />
        </div>
        <button
          onClick={() => onSave({ ...template, focusMins: focus, shortBreakMins: short, longBreakMins: long, sessionsPerCycle: cycles })}
          className="mt-5 w-full py-3.5 rounded-2xl bg-slate-700 text-white font-bold text-sm active:scale-[0.98] transition-transform"
        >
          Apply
        </button>
      </div>
    </motion.div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({ t, active, onSelect }: { t: Template; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex-shrink-0 w-36 rounded-2xl p-3.5 text-left transition-all active:scale-95 relative overflow-hidden',
        `bg-gradient-to-br ${t.gradient}`,
        active ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-[1.02] shadow-lg' : 'opacity-85 hover:opacity-100'
      )}
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/15 rounded-full -translate-y-1/2 translate-x-1/4 blur-lg" />
      <div className="text-white mb-2">{t.icon}</div>
      <p className="text-white font-bold text-sm leading-tight">{t.name}</p>
      <p className="text-white/75 text-[10px] mt-0.5 leading-snug">{t.tagline}</p>
      <div className="mt-2.5 flex gap-1 flex-wrap">
        <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{t.focusMins}m</span>
        <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">+{t.shortBreakMins}m</span>
      </div>
    </button>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

const RING_R = 88;
const RING_CIRC = 2 * Math.PI * RING_R;

function Ring({
  progress, color, track, phase, breathe, status,
}: {
  progress: number; color: string; track: string;
  phase: Phase; breathe?: boolean; status: Status;
}) {
  const offset = RING_CIRC * (1 - progress);
  const isBreak = phase !== 'focus';

  return (
    <motion.div
      animate={isBreak && breathe && status === 'running'
        ? { scale: [1, 1.025, 1, 1.025, 1] }
        : { scale: 1 }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-64 h-64 flex items-center justify-center"
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
        {/* Track */}
        <circle cx="100" cy="100" r={RING_R} fill="none" stroke={track} strokeWidth="10" />
        {/* Progress */}
        <motion.circle
          cx="100" cy="100" r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      {/* Inner glow */}
      <div
        className="absolute inset-4 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
}

// ─── Breathing Guide ──────────────────────────────────────────────────────────

function BreathingGuide({ status }: { status: Status }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    if (status !== 'running') return;
    const sequence = [
      { phase: 'in' as const, dur: 4000 },
      { phase: 'hold' as const, dur: 4000 },
      { phase: 'out' as const, dur: 4000 },
    ];
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    function next() {
      setPhase(sequence[i].phase);
      t = setTimeout(() => { i = (i + 1) % sequence.length; next(); }, sequence[i].dur);
    }
    next();
    return () => clearTimeout(t);
  }, [status]);

  const label = phase === 'in' ? 'Breathe in…' : phase === 'hold' ? 'Hold…' : 'Breathe out…';
  const scale = phase === 'in' ? 1.2 : phase === 'hold' ? 1.2 : 1;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={{ scale }}
        transition={{ duration: 4, ease: 'easeInOut' }}
        className="w-14 h-14 rounded-full border-2 border-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
      >
        <Wind className="w-6 h-6 text-emerald-600" />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
        >
          {label}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ─── Session Dots ─────────────────────────────────────────────────────────────

function SessionDots({ total, done, color }: { total: number; done: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ scale: i < done ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.3 }}
          className="w-2.5 h-2.5 rounded-full transition-colors"
          style={{ backgroundColor: i < done ? color : '#e2e8f0' }}
        />
      ))}
      <span className="text-xs font-bold text-muted-foreground ml-1">
        {done}/{total}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Timer() {
  const [templateId, setTemplateId] = useState('pomodoro');
  const [customTemplate, setCustomTemplate] = useState<Template | null>(null);
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const baseTemplate = TEMPLATES.find(t => t.id === templateId)!;
  const template = (templateId === 'custom' && customTemplate) ? customTemplate : baseTemplate;

  // Timer state
  const [phase, setPhase] = useState<Phase>('focus');
  const [status, setStatus] = useState<Status>('idle');
  const [secondsLeft, setSecondsLeft] = useState(template.focusMins * 60);
  const [sessionsDone, setSessionsDone] = useState(0);   // sessions in current cycle
  const [totalToday, setTotalToday] = useState(0);        // all focus sessions today
  const [tipIndex, setTipIndex] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = phaseDuration(template, phase);
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;

  // ── Rotate tips every 10 s ──
  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % template.tips.length), 10_000);
    return () => clearInterval(t);
  }, [template.tips.length]);

  // ── Clear interval on unmount ──
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ── Advance phase ──
  const advancePhase = useCallback(() => {
    setStatus('idle');
    playTone('end');

    setPhase(prev => {
      if (prev === 'focus') {
        const next = sessionsDone + 1;
        setSessionsDone(next);
        setTotalToday(t => t + 1);
        if (next >= template.sessionsPerCycle) {
          setSecondsLeft(template.longBreakMins * 60);
          return 'longBreak';
        } else {
          setSecondsLeft(template.shortBreakMins * 60);
          return 'shortBreak';
        }
      } else {
        if (prev === 'longBreak') setSessionsDone(0);
        setSecondsLeft(template.focusMins * 60);
        return 'focus';
      }
    });
  }, [sessionsDone, template]);

  // ── Tick ──
  useEffect(() => {
    if (status !== 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { advancePhase(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status, advancePhase]);

  // ── Controls ──
  function handlePlayPause() {
    if (status === 'running') {
      setStatus('paused');
    } else {
      playTone('start');
      setStatus('running');
    }
  }

  function handleReset() {
    setStatus('idle');
    setSecondsLeft(phaseDuration(template, phase));
  }

  function handleSkip() {
    advancePhase();
  }

  // ── Switch template ──
  function selectTemplate(id: string) {
    if (id === 'custom') {
      setShowCustomEditor(true);
      return;
    }
    const t = TEMPLATES.find(x => x.id === id)!;
    setTemplateId(id);
    setPhase('focus');
    setStatus('idle');
    setSecondsLeft(t.focusMins * 60);
    setSessionsDone(0);
  }

  function applyCustom(t: Template) {
    setCustomTemplate(t);
    setTemplateId('custom');
    setPhase('focus');
    setStatus('idle');
    setSecondsLeft(t.focusMins * 60);
    setSessionsDone(0);
    setShowCustomEditor(false);
  }

  const isBreak = phase !== 'focus';
  const label = phaseLabel(phase, template.breathe);

  // Phase accent color
  const phaseColor = isBreak
    ? (template.breathe ? '#10b981' : '#94a3b8')
    : template.ringColor;
  const phaseTrack = isBreak
    ? (template.breathe ? '#d1fae5' : '#f1f5f9')
    : template.ringTrack;

  // Page bg tint
  const bgTint = isBreak
    ? 'from-slate-50 to-background'
    : `to-background from-background`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={cn('pb-28 flex flex-col min-h-full bg-gradient-to-b', bgTint)}
      >
        <TopHeader title="Focus Timer" />

        {/* ── Template Strip ── */}
        <div className="pt-4">
          <button
            onClick={() => setShowTemplates(v => !v)}
            className="flex items-center gap-2 px-5 mb-3 group"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Templates
            </span>
            <motion.div
              animate={{ rotate: showTemplates ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {showTemplates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-3 overflow-x-auto hide-scrollbar px-5 pb-4">
                  {TEMPLATES.map(t => (
                    <TemplateCard
                      key={t.id}
                      t={t}
                      active={t.id === templateId}
                      onSelect={() => selectTemplate(t.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Timer Core ── */}
        <div className="flex-1 flex flex-col items-center px-5 pt-2">

          {/* Phase badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${phase}-${template.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-5"
            >
              <span
                className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{
                  backgroundColor: isBreak ? '#f1f5f9' : template.ringTrack,
                  color: phaseColor,
                }}
              >
                {label}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Ring + time */}
          <div className="relative flex items-center justify-center">
            <Ring
              progress={progress}
              color={phaseColor}
              track={phaseTrack}
              phase={phase}
              breathe={template.breathe}
              status={status}
            />
            <div className="absolute flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={secondsLeft}
                  initial={{ opacity: 0.7, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-5xl font-bold tracking-tighter tabular-nums text-foreground leading-none"
                >
                  {fmt(secondsLeft)}
                </motion.span>
              </AnimatePresence>

              {/* Breathing guide on calm breaks */}
              {isBreak && template.breathe && status === 'running' ? (
                <div className="mt-3">
                  <BreathingGuide status={status} />
                </div>
              ) : (
                <p className="text-xs font-semibold text-muted-foreground mt-2 uppercase tracking-wider">
                  {status === 'idle' ? 'Ready' : status === 'paused' ? 'Paused' : isBreak ? 'Rest' : 'Focus'}
                </p>
              )}
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="flex items-center gap-6 mt-8">
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-90 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <motion.button
              onClick={handlePlayPause}
              whileTap={{ scale: 0.92 }}
              className={cn(
                'w-20 h-20 rounded-full text-white flex items-center justify-center shadow-lg transition-colors',
                template.btnBg
              )}
              style={{ boxShadow: `0 8px 24px ${phaseColor}50` }}
            >
              <AnimatePresence mode="wait">
                {status === 'running' ? (
                  <motion.div key="pause" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
                    <Pause className="w-8 h-8 fill-current" />
                  </motion.div>
                ) : (
                  <motion.div key="play" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <button
              onClick={handleSkip}
              className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-90 transition-all"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* ── Session dots ── */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <SessionDots
              total={template.sessionsPerCycle}
              done={sessionsDone}
              color={template.ringColor}
            />
            {totalToday > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  {totalToday} session{totalToday !== 1 ? 's' : ''} completed today
                </span>
              </motion.div>
            )}
          </div>

          {/* ── Session breakdown ── */}
          <div className="mt-5 w-full grid grid-cols-3 gap-2">
            {[
              { label: 'Focus', val: `${template.focusMins}m`, color: template.badgeBg },
              { label: 'Break', val: `${template.shortBreakMins}m`, color: 'bg-slate-100 text-slate-600' },
              { label: 'Long break', val: `${template.longBreakMins}m`, color: 'bg-slate-100 text-slate-600' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-3 text-center">
                <p className={cn('text-xs font-bold rounded-lg px-2 py-0.5 inline-block mb-1', color)}>{val}</p>
                <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Tips ── */}
          <div className="mt-4 w-full bg-card border border-border rounded-2xl p-4 flex gap-3 shadow-sm">
            <div
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: template.ringColor }}
            >
              💡
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-medium text-foreground/80 leading-relaxed"
              >
                {template.tips[tipIndex % template.tips.length]}
              </motion.p>
            </AnimatePresence>
          </div>

        </div>
      </motion.div>

      {/* Custom editor overlay */}
      <AnimatePresence>
        {showCustomEditor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomEditor(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <CustomEditor
              template={customTemplate ?? TEMPLATES.find(t => t.id === 'custom')!}
              onSave={applyCustom}
              onCancel={() => setShowCustomEditor(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
