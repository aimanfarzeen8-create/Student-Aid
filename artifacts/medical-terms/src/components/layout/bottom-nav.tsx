import React from 'react';
import { useLocation } from 'wouter';
import { Home, Search, Layers, Brain, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'browse', label: 'Browse', icon: Search, path: '/browse' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, path: '/flashcards' },
  { id: 'quiz', label: 'Quiz', icon: Brain, path: '/quiz' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();

  // Highlight exact path or partial match for root vs sub-routes
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] bg-background/90 backdrop-blur-lg border-t border-border px-6 pb-safe pt-2 pointer-events-auto shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between h-14 relative">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className="relative flex flex-col items-center justify-center w-12 h-full gap-1 outline-none"
                data-testid={`nav-${item.id}`}
              >
                {active && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -top-2 w-8 h-1 bg-primary rounded-b-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                  )} 
                  strokeWidth={active ? 2.5 : 2}
                />
                <span 
                  className={cn(
                    "text-[10px] transition-all duration-200",
                    active ? "text-primary font-bold" : "text-muted-foreground font-medium"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
