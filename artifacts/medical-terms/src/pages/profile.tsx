import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Award, Flame, BookOpen, Target, 
  ChevronRight, Moon, Bell, Shield, LogOut, Info
} from 'lucide-react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { cn } from '@/lib/utils';

const STATS = [
  { label: 'Terms Learned', value: '185', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { label: 'Quizzes Taken', value: '24', icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { label: 'Current Streak', value: '7 Days', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  { label: 'Mastery Score', value: '82%', icon: Award, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
];

const ACHIEVEMENTS = [
  { title: '7-Day Streak', icon: Flame, active: true },
  { title: '50 Terms', icon: BookOpen, active: true },
  { title: 'Quiz Master', icon: Target, active: false },
];

export default function Profile() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-background"
    >
      <TopHeader 
        title="Profile" 
        rightAction={
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        } 
      />

      <div className="flex-1 overflow-y-auto px-5 py-6 pb-32 space-y-8">
        
        {/* User Card */}
        <section className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-[#0f766e] p-1 shadow-lg mb-4">
            <div className="w-full h-full bg-background rounded-full flex items-center justify-center text-3xl font-bold text-primary">
              MS
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Alex Mercer</h2>
          <p className="text-sm font-semibold text-muted-foreground mt-1 bg-secondary px-3 py-1 rounded-full">
            First Year • MBBS
          </p>
        </section>

        {/* Badges */}
        <section>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Achievements</h3>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-2">
            {ACHIEVEMENTS.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div key={i} className={cn(
                  "flex flex-col items-center p-4 rounded-2xl border min-w-[100px] shrink-0",
                  badge.active 
                    ? "bg-card border-primary/20 shadow-sm" 
                    : "bg-secondary/50 border-transparent opacity-60 grayscale"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                    badge.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-center leading-tight">{badge.title}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats Grid */}
        <section>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-3", stat.bg, stat.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-2xl font-bold text-foreground mb-1">{stat.value}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Settings List */}
        <section className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border active:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <Bell className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[15px]">Study Reminders</span>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border-b border-border active:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <Moon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[15px]">Dark Mode</span>
            </div>
            <div className="w-12 h-6 bg-secondary rounded-full relative border border-border">
              <div className="absolute left-1 top-1 w-4 h-4 bg-muted-foreground rounded-full"></div>
            </div>
          </div>

          <button className="w-full flex items-center justify-between p-4 border-b border-border active:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3 text-foreground">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[15px]">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button className="w-full flex items-center justify-between p-4 active:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3 text-foreground">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[15px]">About MedTerms</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </section>

        {/* Sign Out */}
        <section>
          <button className="w-full bg-destructive/10 text-destructive font-bold text-[15px] rounded-2xl h-14 flex items-center justify-center gap-2 active:scale-98 transition-transform">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </section>

      </div>
    </motion.div>
  );
}
