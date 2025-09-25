import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Router, Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { DFSIntegrationProvider } from '@/providers/DFSIntegrationProvider';
import { Dashboard } from '@/pages/Dashboard';
import { HealthCheck } from '@/components/HealthCheck';
import './globals.css';

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DFSIntegrationProvider>
        <Router>
          <div className='min-h-screen bg-gray-950 text-white'>
            <HealthCheck />

            <Switch>
              <Route path='/' component={Dashboard} />
              <Route path='/dashboard' component={Dashboard} />
              <Route>
                {/* 404 Page */}
                <div className='flex items-center justify-center min-h-screen'>
                  <div className='text-center'>
                    <h1 className='text-4xl font-bold mb-4'>404</h1>
                    <p className='text-gray-400'>Page not found</p>
                  </div>
                </div>
              </Route>
            </Switch>

            <Toaster />
          </div>
        </Router>
      </DFSIntegrationProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
