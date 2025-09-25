import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Brain,
  Crown,
  TrendingUp,
  FolderOpen,
  Rss,
  Upload,
  Settings,
  Home,
  Zap,
} from 'lucide-react';

export interface DashboardRoute {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description: string;
}

const dashboardRoutes: DashboardRoute[] = [
  {
    id: 'main',
    path: '/',
    label: 'Main Dashboard',
    icon: Home,
    description: 'Core optimization tools and player projections',
  },
  {
    id: 'live-intelligence',
    path: '/live-intelligence',
    label: 'Live Intelligence',
    icon: Zap,
    badge: 'LIVE',
    description: 'Real-time data feeds and live leverage rankings',
  },
  {
    id: 'ai-analytics',
    path: '/ai-analytics',
    label: 'AI Analytics',
    icon: Brain,
    badge: 'AI',
    description: 'Multi-model AI insights and confidence scoring',
  },
  {
    id: 'premium',
    path: '/premium',
    label: 'Premium',
    icon: Crown,
    badge: 'PRO',
    description: 'Advanced metrics and professional analytics',
  },
  {
    id: 'simulation',
    path: '/simulation',
    label: 'Simulation',
    icon: BarChart3,
    description: 'Monte Carlo results and correlation analysis',
  },
  {
    id: 'portfolio',
    path: '/portfolio',
    label: 'Portfolio',
    icon: FolderOpen,
    description: 'Multi-lineup analysis and exposure tracking',
  },
  {
    id: 'content',
    path: '/content',
    label: 'Content Hub',
    icon: Rss,
    description: 'News aggregation and breaking news alerts',
  },
  {
    id: 'upload',
    path: '/upload',
    label: 'Upload Center',
    icon: Upload,
    description: 'Bulk CSV management and data validation',
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    description: 'System configuration and API management',
  },
];

interface DashboardNavProps {
  collapsed?: boolean;
}

export default function DashboardNav({ collapsed = false }: DashboardNavProps) {
  const [location] = useLocation();

  return (
    <nav className='space-y-2'>
      <div className='px-3 py-2'>
        <h2
          className={`text-lg font-semibold tracking-tight ${collapsed ? 'sr-only' : ''}`}
        >
          Dashboards
        </h2>
        {collapsed && <div className='w-8 h-0.5 bg-primary rounded-full mx-auto'></div>}
      </div>

      <div className='space-y-1'>
        {dashboardRoutes.map(route => {
          const isActive = location === route.path;
          const IconComponent = route.icon;

          return (
            <Link key={route.id} href={route.path}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start relative ${
                  collapsed ? 'px-2' : 'px-3'
                } ${isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                title={collapsed ? `${route.label}: ${route.description}` : undefined}
              >
                <IconComponent
                  className={`h-4 w-4 ${collapsed ? '' : 'mr-2'} flex-shrink-0`}
                />

                {!collapsed && (
                  <>
                    <span className='truncate'>{route.label}</span>
                    {route.badge && (
                      <Badge
                        variant={route.badge === 'LIVE' ? 'destructive' : 'secondary'}
                        className='ml-auto text-xs px-1.5 py-0.5'
                      >
                        {route.badge}
                      </Badge>
                    )}
                  </>
                )}

                {isActive && (
                  <div className='absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full'></div>
                )}
              </Button>
            </Link>
          );
        })}
      </div>

      {!collapsed && (
        <div className='px-3 py-2 text-xs text-muted-foreground'>
          <p>
            Navigate between specialized dashboards for different aspects of DFS
            optimization.
          </p>
        </div>
      )}
    </nav>
  );
}

export { dashboardRoutes };
