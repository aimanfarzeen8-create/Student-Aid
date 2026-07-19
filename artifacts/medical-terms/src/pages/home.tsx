import React from 'react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { motion } from 'framer-motion';
import { Bell, Heart, BookOpen, Brain, Activity, Droplet, Zap, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

const STATS = [
  { label: 'Terms', value: '432' },
  { label: 'Learned', value: '185' },
  { label: 'Favorites', value: '24' },
];

const CATEGORIES = [
  { name: 'Cardiology', icon: Heart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  { name: 'Neurology', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  { name: 'Pharmacology', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { name: 'Hematology', icon: Droplet, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  { name: 'Pathology', icon: Activity, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30' },
];

const RECENT_TERM = {
  name: 'Tachycardia',
  category: 'Cardiology',
  definition: 'A condition that makes your heart beat more than 100 times per minute. It can be caused by various factors including stress, illness, or heart conditions.',
};

export default function Home() {
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

      <div className="px-5 py-6 space-y-8">
        
        {/* Greeting */}
        <section className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">Good morning,</h2>
          <h1 className="text-2xl font-bold tracking-tight">Doctor-in-Training</h1>
        </section>

        {/* Progress Card */}
        <section>
          <div className="bg-card rounded-3xl p-5 border border-border shadow-sm flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            
            <div className="relative w-20 h-20 shrink-0">
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
                <span className="text-xl font-bold text-primary">42%</span>
              </div>
            </div>

            <div className="flex-1 z-10">
              <h3 className="font-semibold text-lg">Year 1 Progress</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                You're making great progress! Keep reviewing cards to reach your daily goal.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-3 gap-3">
          {STATS.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              <span className="text-xs font-medium text-muted-foreground mt-1">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* Continue Studying */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Continue Studying</h3>
            <Link href="/browse" className="text-sm font-semibold text-primary">View All</Link>
          </div>
          
          <div className="bg-gradient-to-br from-primary to-[#115e59] rounded-3xl p-6 text-primary-foreground shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
              <Heart className="w-48 h-48 -translate-y-8 translate-x-8" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex bg-white/20 backdrop-blur-md self-start px-3 py-1 rounded-full text-xs font-medium mb-4">
                {RECENT_TERM.category}
              </div>
              
              <h4 className="text-2xl font-bold mb-2">{RECENT_TERM.name}</h4>
              <p className="text-primary-foreground/80 text-sm line-clamp-2 leading-relaxed mb-6">
                {RECENT_TERM.definition}
              </p>
              
              <Link href="/flashcards" className="bg-white text-primary font-bold px-5 py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-transform">
                <BookOpen className="w-4 h-4" />
                Review Now
              </Link>
            </div>
          </div>
        </section>

        {/* Categories Quick Access */}
        <section className="space-y-4">
          <h3 className="font-bold text-lg">Categories</h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-5 px-5">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <button key={i} className="flex flex-col items-center gap-3 shrink-0 group">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95", cat.bg)}>
                    <Icon className={cn("w-7 h-7", cat.color)} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </motion.div>
  );
}
