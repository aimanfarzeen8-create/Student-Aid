import React from 'react';
import { BottomNav } from './bottom-nav';

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-[100dvh] flex justify-center bg-[#e2e8f0] dark:bg-black w-full">
      <div className="w-full max-w-[430px] bg-background relative shadow-2xl flex flex-col h-[100dvh] overflow-hidden border-x border-border/50">
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}

export function TopHeader({ 
  title, 
  rightAction 
}: { 
  title: React.ReactNode; 
  rightAction?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-5 h-16 flex items-center justify-between shrink-0">
      <h1 className="font-bold text-xl text-foreground tracking-tight">{title}</h1>
      {rightAction && (
        <div className="flex items-center">
          {rightAction}
        </div>
      )}
    </div>
  );
}
