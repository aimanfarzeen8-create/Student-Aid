import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AnimatePresence } from 'framer-motion';

import { MobileShell } from '@/components/layout/mobile-shell';
import Home from '@/pages/home';
import Browse from '@/pages/browse';
import Flashcards from '@/pages/flashcards';
import Quiz from '@/pages/quiz';
import Profile from '@/pages/profile';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <MobileShell>
      <AnimatePresence mode="wait">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/browse" component={Browse} />
          <Route path="/flashcards" component={Flashcards} />
          <Route path="/quiz" component={Quiz} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </AnimatePresence>
    </MobileShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
        <SonnerToaster position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
