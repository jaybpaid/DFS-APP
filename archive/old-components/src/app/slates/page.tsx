import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon, CurrencyDollarIcon, UsersIcon } from '@heroicons/react/24/outline';

interface Slate {
  slate_id: string;
  name: string;
  sport: string;
  site: string;
  start_time: string;
  entry_fee: number;
  total_payouts: number;
  contest_count?: number;
  max_entry_fee?: number;
  total_entries?: number;
  game_type?: string;
}

export default function SlatesPage() {
  // Fetch COMPREHENSIVE future slate data from backend
  const {
    data: slateData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['comprehensive-future-slates'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/slates/future');
      if (!response.ok) throw new Error('Failed to fetch comprehensive future slates');
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes for comprehensive data
  });

  const slates: Slate[] = slateData?.slates || [];

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='bg-white shadow rounded-lg p-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Live DFS Slates</h1>
          <div className='animate-pulse'>
            <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
            <div className='space-y-3'>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded w-5/6'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <div className='bg-white shadow rounded-lg p-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Live DFS Slates</h1>
          <div className='bg-red-50 border border-red-200 rounded-md p-4'>
            <p className='text-red-800'>
              Error loading live slate data: {error.message}
            </p>
            <p className='text-red-600 text-sm mt-2'>
              Please ensure the backend is running on port 8000
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Live DFS Slates</h1>
            <p className='text-gray-600 mt-1'>
              {slates.length > 0
                ? `${slates.length} live slates available • Updated every minute`
                : 'Loading live slate data...'}
            </p>
          </div>
          <div className='text-right'>
            <div className='text-sm text-gray-500'>Last Updated</div>
            <div className='text-lg font-semibold text-gray-900'>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {slates.length === 0 ? (
          <div className='text-center py-12'>
            <ClockIcon className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No live slates found
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Check backend connection or try refreshing
            </p>
          </div>
        ) : (
          <div className='grid gap-4'>
            {slates.map(slate => (
              <div
                key={slate.slate_id}
                className='border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer'
              >
                <div className='flex justify-between items-start mb-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {slate.name}
                    </h3>
                    <div className='flex items-center space-x-4 mt-2 text-sm text-gray-500'>
                      <span className='flex items-center'>
                        <span className='font-medium'>{slate.sport}</span>
                        <span className='mx-2'>•</span>
                        <span>{slate.site}</span>
                        {slate.game_type && (
                          <>
                            <span className='mx-2'>•</span>
                            <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs'>
                              {slate.game_type}
                            </span>
                          </>
                        )}
                      </span>
                      <span className='flex items-center'>
                        <ClockIcon className='w-4 h-4 mr-1' />
                        {new Date(slate.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-2xl font-bold text-green-600'>
                      ${(slate.total_payouts / 1000000).toFixed(1)}M
                    </div>
                    <div className='text-xs text-gray-500'>Total Prizes</div>
                  </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-gray-900'>
                      ${slate.entry_fee}
                    </div>
                    <div className='text-xs text-gray-500'>Entry Fee</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-gray-900'>
                      {slate.contest_count || 'N/A'}
                    </div>
                    <div className='text-xs text-gray-500'>Contests</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-blue-600'>FUTURE</div>
                    <div className='text-xs text-gray-500'>Status</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-gray-900'>
                      {slate.total_entries?.toLocaleString() || 'N/A'}
                    </div>
                    <div className='text-xs text-gray-500'>Total Entries</div>
                  </div>
                </div>

                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <button className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors'>
                    Select This Slate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
