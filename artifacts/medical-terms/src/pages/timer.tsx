import React from 'react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Play, RotateCcw, SkipForward, Lightbulb } from 'lucide-react';

const SESSION_TYPES = ['Focus', 'Short Break', 'Long Break', 'Custom'];

export default function Timer() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pb-24 flex flex-col h-full bg-background"
    >
      <TopHeader title="Timer" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 min-h-0">
        
        {/* Timer Display */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          {/* Decorative outer ring */}
          <div className="absolute inset-0 rounded-full border-[12px] border-secondary/50"></div>
          {/* Progress ring placeholder */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="44" 
              className="stroke-primary fill-none" 
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="276"
              strokeDashoffset="0"
            />
          </svg>
          <div className="flex flex-col items-center relative z-10 pt-2">
            <span className="text-6xl font-bold tracking-tighter text-foreground tabular-nums leading-none">
              25:00
            </span>
            <span className="text-sm font-semibold text-muted-foreground mt-3 uppercase tracking-widest">
              Pomodoro Session
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8 mb-10">
          <button className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all active:scale-95">
            <SkipForward className="w-6 h-6" />
          </button>
          
          <button className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform pl-1">
            <Play className="w-8 h-8 fill-current" />
          </button>
          
          <button className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all active:scale-95">
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>

        {/* Session Type Chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {SESSION_TYPES.map((type) => (
            <button 
              key={type}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold transition-colors",
                type === 'Focus' 
                  ? "bg-foreground text-background" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Sessions Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="w-2.5 h-2.5 rounded-full bg-secondary"
            />
          ))}
          <span className="text-xs font-bold text-muted-foreground ml-2">0/4 Sessions</span>
        </div>

        {/* Tip Card */}
        <div className="mt-auto w-full bg-accent/30 dark:bg-accent/10 border border-accent/20 rounded-2xl p-4 flex gap-3 shadow-sm">
          <div className="w-8 h-8 shrink-0 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-foreground/80 leading-relaxed">
            Turn on 'Do Not Disturb' to stay fully immersed during focus blocks.
          </p>
        </div>

      </div>
    </motion.div>
  );
}
