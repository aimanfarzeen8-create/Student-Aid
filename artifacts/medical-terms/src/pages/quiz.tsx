import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

// Static mockup data
const MOCK_QUESTION = {
  term: "Erythrocyte",
  subtitle: "What is the primary function of this structure?",
  options: [
    { id: 'A', text: "To produce antibodies for immune response", state: 'wrong' },
    { id: 'B', text: "To carry oxygen to body tissues", state: 'correct' },
    { id: 'C', text: "To clot blood at the site of an injury", state: 'default' },
    { id: 'D', text: "To filter waste products from plasma", state: 'default' }
  ]
};

export default function Quiz() {
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // For mockup purposes, if they click B, we show success, otherwise we show error for that option and success for B.
  const handleSelect = (id: string) => {
    if (showResult) return;
    setSelected(id);
    setShowResult(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-background"
    >
      <TopHeader 
        title="Pop Quiz" 
        rightAction={
          <div className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Score</span>
            <span className="text-sm font-bold text-foreground">2/3</span>
          </div>
        }
      />

      {/* Progress */}
      <div className="px-5 py-4 flex items-center gap-4 border-b border-border bg-card z-10">
        <span className="text-sm font-bold text-foreground whitespace-nowrap">Q 4 of 10</span>
        <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full w-[40%] transition-all duration-500"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8 pb-32 flex flex-col">
        
        {/* Question Card */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-foreground tracking-tight mb-4">
            {MOCK_QUESTION.term}
          </h2>
          <p className="text-lg font-medium text-muted-foreground leading-snug px-4">
            {MOCK_QUESTION.subtitle}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {MOCK_QUESTION.options.map((opt) => {
            const isSelected = selected === opt.id;
            
            // Determine styles based on mockup state logic
            let containerStyles = "bg-card border-border hover:border-primary/50 text-foreground";
            let icon = null;

            if (showResult) {
              if (opt.state === 'correct') {
                containerStyles = "bg-green-50 border-green-500 text-green-900 dark:bg-green-950/40 dark:border-green-600 dark:text-green-100";
                icon = <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
              } else if (isSelected && opt.state === 'wrong') {
                containerStyles = "bg-red-50 border-red-500 text-red-900 dark:bg-red-950/40 dark:border-red-600 dark:text-red-100";
                icon = <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
              } else {
                containerStyles = "bg-card/50 border-border/50 text-muted-foreground opacity-60";
              }
            } else if (isSelected) {
              containerStyles = "bg-primary/10 border-primary text-primary";
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={showResult}
                className={cn(
                  "w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] flex items-center justify-between gap-4 shadow-sm",
                  containerStyles
                )}
              >
                <div className="flex items-start gap-4">
                  <span className={cn(
                    "w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border",
                    showResult ? "border-transparent bg-background/50" : "border-border bg-secondary"
                  )}>
                    {opt.id}
                  </span>
                  <span className="font-semibold text-[15px] leading-relaxed pt-0.5">{opt.text}</span>
                </div>
                {icon && <div className="shrink-0">{icon}</div>}
              </button>
            );
          })}
        </div>

      </div>

      {/* Fixed Next Button */}
      <div className="fixed bottom-[88px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pointer-events-none">
        <button 
          className={cn(
            "w-full h-14 rounded-2xl font-bold text-lg shadow-lg pointer-events-auto transition-all duration-300",
            showResult 
              ? "bg-primary text-primary-foreground translate-y-0 opacity-100" 
              : "bg-secondary text-muted-foreground translate-y-4 opacity-0 pointer-events-none"
          )}
        >
          Next Question
        </button>
      </div>

    </motion.div>
  );
}
