import { Bell } from 'lucide-react';
import { DataSource } from '@shared/schema';

interface HeaderNavProps {
  dataSources: DataSource[];
  isLoading: boolean;
}

export default function HeaderNav({ dataSources, isLoading }: HeaderNavProps) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'success':
        return 'status-success';
      case 'updating':
        return 'status-warning';
      case 'error':
        return 'status-error';
      default:
        return 'status-idle';
    }
  };

  return (
    <header className='border-b border-border bg-card sticky top-0 z-50'>
      <div className='flex h-16 items-center px-6 gap-6'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 gradient-primary rounded-lg flex items-center justify-center'>
            <span className='text-primary-foreground font-bold text-sm'>ED</span>
          </div>
          <h1 className='text-xl font-semibold'>Elite DFS Optimizer</h1>
        </div>

        <nav className='hidden md:flex items-center gap-6 ml-8'>
          <span className='text-sm font-medium text-primary border-b-2 border-primary pb-1'>
            Dashboard
          </span>
          <span className='text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer'>
            Projections
          </span>
          <span className='text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer'>
            Lineups
          </span>
          <span className='text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer'>
            Analytics
          </span>
        </nav>

        <div className='ml-auto flex items-center gap-4'>
          <div className='hidden lg:flex items-center gap-3'>
            {dataSources
              .filter(ds => ['nfl', 'nba'].includes(ds.sport))
              .map(source => (
                <div key={source.id} className='flex items-center gap-1'>
                  <span
                    className={`status-dot ${getStatusColor(source.status)}`}
                  ></span>
                  <span className='text-xs text-muted-foreground'>
                    {source.sport.toUpperCase()}
                  </span>
                </div>
              ))}
            {dataSources
              .filter(ds => ds.category === 'weather')
              .map(source => (
                <div key={source.id} className='flex items-center gap-1'>
                  <span
                    className={`status-dot ${getStatusColor(source.status)}`}
                  ></span>
                  <span className='text-xs text-muted-foreground'>Weather</span>
                </div>
              ))}
            {dataSources
              .filter(ds => ds.category === 'odds')
              .map(source => (
                <div key={source.id} className='flex items-center gap-1'>
                  <span
                    className={`status-dot ${getStatusColor(source.status)}`}
                  ></span>
                  <span className='text-xs text-muted-foreground'>Odds</span>
                </div>
              ))}
          </div>

          <button
            className='p-2 hover:bg-muted rounded-md'
            data-testid='button-notifications'
          >
            <Bell className='w-5 h-5' />
          </button>

          <div className='w-8 h-8 rounded-full bg-muted flex items-center justify-center'>
            <span className='text-sm font-medium'>JD</span>
          </div>
        </div>
      </div>
    </header>
  );
}
