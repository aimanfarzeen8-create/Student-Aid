import React from 'react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus, Circle } from 'lucide-react';

const WEEK_DAYS = [
  { day: 'Mon', date: '12' },
  { day: 'Tue', date: '13', active: true },
  { day: 'Wed', date: '14' },
  { day: 'Thu', date: '15' },
  { day: 'Fri', date: '16' },
  { day: 'Sat', date: '17' },
  { day: 'Sun', date: '18' },
];

const TASKS = [
  { id: 1, title: 'Review Cardiology terms', time: '9:00 AM', category: 'Study', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { id: 2, title: 'Complete Quiz 3', time: '1:00 PM', category: 'Assessment', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 3, title: 'Read Neurology Chapter 4', time: '4:30 PM', category: 'Reading', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
];

export default function Planner() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pb-24 flex flex-col min-h-full"
    >
      <TopHeader title="Planner" />

      {/* Calendar Strip */}
      <div className="bg-background border-b border-border py-4 px-2">
        <div className="flex justify-between items-center max-w-full overflow-x-auto hide-scrollbar gap-2 px-3">
          {WEEK_DAYS.map((d, i) => (
            <div 
              key={i} 
              className={cn(
                "flex flex-col items-center justify-center w-12 h-16 rounded-2xl shrink-0 transition-colors",
                d.active ? "bg-primary text-primary-foreground shadow-sm" : "bg-transparent text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{d.day}</span>
              <span className={cn(
                "text-lg font-bold",
                d.active ? "text-primary-foreground" : "text-foreground"
              )}>{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-6 flex-1 relative">
        <h2 className="font-bold text-lg mb-4">Today's Tasks</h2>
        
        <div className="space-y-3">
          {TASKS.map((task) => (
            <div key={task.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-start gap-4">
              <button className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0">
                <Circle className="w-6 h-6 stroke-[1.5]" />
              </button>
              <div className="flex-1">
                <h3 className="font-bold text-[15px] text-foreground leading-tight">{task.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-muted-foreground">{task.time}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                  <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider", task.color)}>
                    {task.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );
}
