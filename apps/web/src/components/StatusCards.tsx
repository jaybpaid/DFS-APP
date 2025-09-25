import { Users, FileText, BarChart3, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardStats } from '@shared/schema';

interface StatusCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export default function StatusCards({ stats, isLoading }: StatusCardsProps) {
  if (isLoading) {
    return (
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardContent className='p-4'>
              <div className='h-16 bg-muted rounded'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatLastUpdate = (date: Date | string | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Never';
    const diff = Math.floor((now.getTime() - dateObj.getTime()) / 60000);
    if (diff < 1) return 'Now';
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Players</p>
              <p className='text-2xl font-bold' data-testid='text-player-count'>
                {stats?.playerCount || 0}
              </p>
            </div>
            <div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center'>
              <Users className='w-5 h-5 text-primary' />
            </div>
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Active roster pool</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Lineups</p>
              <p className='text-2xl font-bold' data-testid='text-lineup-count'>
                {stats?.lineupCount || 0}
              </p>
            </div>
            <div className='w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center'>
              <FileText className='w-5 h-5 text-accent' />
            </div>
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Generated lineups</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Simulations</p>
              <p className='text-2xl font-bold' data-testid='text-simulation-count'>
                {stats?.simulationCount || '0'}
              </p>
            </div>
            <div className='w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center'>
              <BarChart3 className='w-5 h-5 text-chart-3' />
            </div>
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Monte Carlo runs</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Last Update</p>
              <p className='text-2xl font-bold' data-testid='text-last-update'>
                {formatLastUpdate(stats?.lastUpdate || null)}
              </p>
            </div>
            <div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center'>
              <Clock className='w-5 h-5 text-primary' />
            </div>
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Data refresh</p>
        </CardContent>
      </Card>
    </div>
  );
}
