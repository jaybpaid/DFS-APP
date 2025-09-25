import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CloudArrowUpIcon,
  ClockIcon,
  CpuChipIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  TvIcon,
  RssIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Uploads', href: '/uploads', icon: CloudArrowUpIcon },
  { name: 'Optimizer', href: '/optimizer', icon: CpuChipIcon },
  { name: 'Simulations', href: '/sims', icon: ChartBarIcon },
  { name: 'Content Hub', href: '/content', icon: RssIcon },
  { name: 'Live Dashboard', href: '/dashboard/live', icon: TvIcon },
  { name: 'AI Dashboard', href: '/ai-dashboard', icon: CpuChipIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className='hidden md:flex md:w-64 md:flex-col'>
      <div className='flex flex-col flex-grow pt-5 bg-gray-900 overflow-y-auto'>
        <div className='flex items-center flex-shrink-0 px-4'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>DFS</span>
              </div>
            </div>
            <div className='ml-3'>
              <div className='text-white text-lg font-medium'>DFS Optimizer</div>
              <div className='text-gray-300 text-xs'>Professional Edition</div>
            </div>
          </div>
        </div>

        <div className='mt-5 flex-1 flex flex-col'>
          <nav className='flex-1 px-2 pb-4 space-y-1'>
            {navigation.map(item => {
              const current = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    current
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      current ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                    aria-hidden='true'
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
