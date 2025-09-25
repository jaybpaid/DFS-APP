import { Badge } from '@/components/ui/badge';
import { useDFSIntegration } from '@/providers/DFSIntegrationProvider';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';

export function HealthCheck() {
  const { backendHealth } = useDFSIntegration();

  const overallHealth = backendHealth.dfsSystem2 && backendHealth.draftKingsApi;

  if (overallHealth) {
    return null; // Hide when everything is working
  }

  return (
    <div className='bg-red-900/20 border-b border-red-800 p-3'>
      <div className='max-w-7xl mx-auto flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <AlertTriangle className='w-5 h-5 text-red-400' />
          <span className='text-red-300 font-medium'>System Status Issues</span>
        </div>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-300'>DFS-SYSTEM-2:</span>
            <Badge
              variant={backendHealth.dfsSystem2 ? 'default' : 'destructive'}
              className='flex items-center gap-1'
            >
              {backendHealth.dfsSystem2 ? (
                <CheckCircle className='w-3 h-3' />
              ) : (
                <Activity className='w-3 h-3' />
              )}
              {backendHealth.dfsSystem2 ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-300'>DraftKings API:</span>
            <Badge
              variant={backendHealth.draftKingsApi ? 'default' : 'destructive'}
              className='flex items-center gap-1'
            >
              {backendHealth.draftKingsApi ? (
                <CheckCircle className='w-3 h-3' />
              ) : (
                <Activity className='w-3 h-3' />
              )}
              {backendHealth.draftKingsApi ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
