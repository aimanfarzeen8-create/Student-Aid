import React from 'react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { motion } from 'framer-motion';
import { Bell, CalendarDays, Timer, Search, Brain, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pb-24 flex flex-col"
    >
      <TopHeader 
        title="MedTerms" 
        rightAction={
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary transition-colors relative">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
          </button>
        } 
      />

      <div className="px-5 py-6 space-y-6">
        
        {/* Greeting */}
        <section className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">Good morning,</h2>
          <h1 className="text-2xl font-bold tracking-tight">Doctor-in-Training</h1>
        </section>

        {/* Compact Progress Card */}
        <section>
          <div className="bg-card rounded-3xl p-4 border border-border shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-muted fill-none" 
                  strokeWidth="8"
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-primary fill-none" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset="145" // roughly 42%
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-sm font-bold text-primary">42%</span>
              </div>
            </div>

            <div className="flex-1 z-10">
              <h3 className="font-semibold text-base">Year 1 Progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                You're making great progress! Keep reviewing cards to reach your daily goal.
              </p>
            </div>
          </div>
        </section>

        {/* 4 Section Widgets */}
        <section className="grid grid-cols-2 gap-4">
          
          {/* Widget 1 - Planner */}
          <button 
            onClick={() => setLocation('/planner')}
            className="text-left bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-4 aspect-[4/5] flex flex-col justify-between relative overflow-hidden active:scale-95 transition-transform shadow-md"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/4"></div>
            <CalendarDays className="w-8 h-8 text-white relative z-10" />
            <div className="relative z-10 mt-auto">
              <h3 className="text-white font-bold text-lg leading-tight">Planner</h3>
              <p className="text-white/80 text-xs mt-1 font-medium">Organize your study schedule</p>
              <div className="mt-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-flex self-start">
                <span className="text-white text-[10px] font-bold">3 tasks today</span>
              </div>
            </div>
          </button>

          {/* Widget 2 - Timer */}
          <button 
            onClick={() => setLocation('/timer')}
            className="text-left bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-4 aspect-[4/5] flex flex-col justify-between relative overflow-hidden active:scale-95 transition-transform shadow-md"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/4"></div>
            <Timer className="w-8 h-8 text-white relative z-10" />
            <div className="relative z-10 mt-auto">
              <h3 className="text-white font-bold text-lg leading-tight">Timer</h3>
              <p className="text-white/80 text-xs mt-1 font-medium">Focus & Pomodoro sessions</p>
              <div className="mt-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-flex self-start">
                <span className="text-white text-[10px] font-bold">25:00 ready</span>
              </div>
            </div>
          </button>

          {/* Widget 3 - Browse */}
          <button 
            onClick={() => setLocation('/browse')}
            className="text-left bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl p-4 aspect-[4/5] flex flex-col justify-between relative overflow-hidden active:scale-95 transition-transform shadow-md"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/4"></div>
            <Search className="w-8 h-8 text-white relative z-10" />
            <div className="relative z-10 mt-auto">
              <h3 className="text-white font-bold text-lg leading-tight">Browse</h3>
              <p className="text-white/80 text-xs mt-1 font-medium">Explore medical terms</p>
              <div className="mt-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-flex self-start">
                <span className="text-white text-[10px] font-bold">432 terms</span>
              </div>
            </div>
          </button>

          {/* Widget 4 - Quiz */}
          <button 
            onClick={() => setLocation('/quiz')}
            className="text-left bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-4 aspect-[4/5] flex flex-col justify-between relative overflow-hidden active:scale-95 transition-transform shadow-md"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/4"></div>
            <Brain className="w-8 h-8 text-white relative z-10" />
            <div className="relative z-10 mt-auto">
              <h3 className="text-white font-bold text-lg leading-tight">Quiz</h3>
              <p className="text-white/80 text-xs mt-1 font-medium">Test your knowledge</p>
              <div className="mt-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-flex self-start">
                <span className="text-white text-[10px] font-bold">Last score: 8/10</span>
              </div>
            </div>
          </button>

        </section>

        {/* Recent Activity */}
        <section className="space-y-3">
          <h3 className="font-bold text-base text-foreground">Recent Activity</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Reviewed Tachycardia</p>
                <p className="text-xs text-muted-foreground mt-0.5">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Completed Cardiology Quiz</p>
                <p className="text-xs text-muted-foreground mt-0.5">Yesterday</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
}
