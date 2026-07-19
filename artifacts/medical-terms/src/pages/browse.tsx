import React from 'react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { motion } from 'framer-motion';
import { Search, Filter, Bookmark, Heart, Stethoscope, Droplet, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const FILTERS_DIFFICULTY = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const FILTERS_CATEGORY = ['All', 'Anatomy', 'Cardiology', 'Neurology', 'Pharmacology'];

const TERMS = [
  { id: 1, name: 'Tachycardia', category: 'Cardiology', diff: 'Beginner', diffColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', def: 'A condition that makes your heart beat more than 100 times per minute. It can be caused by various factors including stress, illness, or heart conditions.', saved: true },
  { id: 2, name: 'Erythrocyte', category: 'Hematology', diff: 'Intermediate', diffColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', def: 'A red blood cell that is typically a biconcave disc without a nucleus. Erythrocytes contain the pigment hemoglobin, which imparts the red color to blood.', saved: false },
  { id: 3, name: 'Aphasia', category: 'Neurology', diff: 'Advanced', diffColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', def: 'Loss of ability to understand or express speech, caused by brain damage.', saved: true },
  { id: 4, name: 'Phagocytosis', category: 'Cellular', diff: 'Intermediate', diffColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', def: 'The ingestion of bacteria or other material by phagocytes and amoeboid protozoans.', saved: false },
  { id: 5, name: 'Myocardial Infarction', category: 'Cardiology', diff: 'Advanced', diffColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', def: 'A heart attack, which occurs when blood flow decreases or stops to a part of the heart, causing damage to the heart muscle.', saved: false },
  { id: 6, name: 'Hypertension', category: 'General', diff: 'Beginner', diffColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', def: 'Abnormally high blood pressure, typically defined as having a blood pressure higher than 140 over 90 millimeters of mercury.', saved: false },
];

export default function Browse() {
  const [activeDiff, setActiveDiff] = React.useState('All');
  const [activeCat, setActiveCat] = React.useState('All');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-background"
    >
      <TopHeader 
        title="Dictionary" 
        rightAction={
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        } 
      />

      {/* Sticky Top Controls */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border pt-4 pb-2 space-y-4">
        {/* Search */}
        <div className="px-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search medical terms..." 
              className="w-full bg-secondary/50 border border-transparent focus:border-primary focus:bg-background h-12 rounded-2xl pl-12 pr-4 outline-none transition-all placeholder:text-muted-foreground font-medium"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex overflow-x-auto hide-scrollbar gap-2 px-5 pb-1">
            {FILTERS_DIFFICULTY.map(f => (
              <button 
                key={f}
                onClick={() => setActiveDiff(f)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
                  activeDiff === f 
                    ? "bg-foreground text-background" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex overflow-x-auto hide-scrollbar gap-2 px-5 pb-2">
            {FILTERS_CATEGORY.map(f => (
              <button 
                key={f}
                onClick={() => setActiveCat(f)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border",
                  activeCat === f 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-border bg-transparent text-muted-foreground hover:bg-secondary/50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 pb-28">
        <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground mb-2">
          <span>{TERMS.length} terms found</span>
        </div>

        {TERMS.map((term) => (
          <div key={term.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-bold text-lg text-foreground leading-tight mb-2">{term.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground">
                    {term.category}
                  </span>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider", term.diffColor)}>
                    {term.diff}
                  </span>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-primary transition-colors shrink-0 p-1 -m-1">
                <Bookmark className={cn("w-5 h-5", term.saved && "fill-primary text-primary")} />
              </button>
            </div>
            
            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
              {term.def}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
