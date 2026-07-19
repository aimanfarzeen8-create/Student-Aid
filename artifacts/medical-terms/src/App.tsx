import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AppLayout } from '@/components/layout/app-layout';
import Dashboard from '@/pages/dashboard';
import Terms from '@/pages/terms';
import TermDetail from '@/pages/term-detail';
import Flashcards from '@/pages/flashcards';
import Quiz from '@/pages/quiz';
import AddTerm from '@/pages/add-term';

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
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/terms" component={Terms} />
        <Route path="/terms/:id" component={TermDetail} />
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/quiz" component={Quiz} />
        <Route path="/add" component={AddTerm} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
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
