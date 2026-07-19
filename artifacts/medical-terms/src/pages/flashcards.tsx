import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { TopHeader } from '@/components/layout/mobile-shell';
import { cn } from '@/lib/utils';

export default function Flashcards() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-background"
    >
      <TopHeader 
        title={
          <div className="flex flex-col items-start">
            <span className="text-lg font-bold">Study Mode</span>
            <span className="text-xs font-semibold text-muted-foreground">Card 1 of 30</span>
          </div>
        }
        rightAction={
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary transition-colors">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        } 
      />

      {/* Progress bar */}
      <div className="w-full h-1 bg-secondary">
        <div className="h-full bg-primary w-[3.33%] rounded-r-full transition-all duration-300"></div>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-8 pb-28">
        
        {/* Card Container with 3D perspective */}
        <div 
          className="flex-1 perspective-1000 relative cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={cn(
            "w-full h-full relative transform-style-3d transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-3xl",
            isFlipped ? "rotate-y-180" : "rotate-y-0"
          )}>
            
            {/* Front of Card */}
            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary to-[#115e59] rounded-3xl p-8 flex flex-col items-center justify-center shadow-lg border border-primary/20">
              <span className="absolute top-6 left-6 text-primary-foreground/60 text-xs font-bold uppercase tracking-widest">
                Cardiology
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white text-center leading-tight tracking-tight">
                Tachycardia
              </h2>
            </div>

            {/* Back of Card */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card rounded-3xl p-8 flex flex-col shadow-lg border border-border">
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6">
                Definition
              </span>
              
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-primary mb-4">Tachycardia</h3>
                <p className="text-foreground text-lg leading-relaxed font-medium">
                  A condition that makes your heart beat more than 100 times per minute.
                </p>
                
                <div className="mt-8 p-4 bg-secondary rounded-xl border border-border/50">
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Example</span>
                  <p className="text-sm italic text-foreground/80">
                    "The patient presented with sinus tachycardia, likely due to acute anxiety."
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="text-center mt-6 h-6">
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">
            Tap card to flip
          </p>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between mt-8 gap-4">
          <button className="w-14 h-14 flex items-center justify-center rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shrink-0">
            <ChevronLeft className="w-7 h-7" />
          </button>
          
          <button className="flex-1 h-14 bg-foreground text-background font-bold text-lg rounded-2xl flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors active:scale-95">
            <Check className="w-5 h-5" />
            Mark Learned
          </button>
          
          <button className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors shrink-0">
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>

      </div>
    </motion.div>
  );
}
