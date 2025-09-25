import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDownIcon,
  ClockIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface ComprehensiveSlate {
  slate_id: string;
  name: string;
  sport: string;
  site: string;
  start_time: string;
  entry_fee: number;
  total_payouts: number;
  contest_count: number;
  max_entry_fee: number;
  total_entries: number;
  game_type: string;
  search_popularity?: number;
  trending_score?: number;
  risk_analysis?: string;
}

interface ProfessionalSlateSelectorProps {
  selectedSlateId?: string;
  onSlateChange: (slate: ComprehensiveSlate) => void;
  className?: string;
}

export default function ProfessionalSlateSelector({
  selectedSlateId,
  onSlateChange,
  className,
}: ProfessionalSlateSelectorProps) {
  const [isSlateModalOpen, setIsSlateModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<'DraftKings' | 'FanDuel'>(
    'DraftKings'
  );

  // Fetch comprehensive future slates
  const {
    data: slateData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['comprehensive-slates'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/slates/future');
      if (!response.ok) throw new Error('Failed to fetch comprehensive slates');
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const slates: ComprehensiveSlate[] = slateData?.slates || [];
  const selectedSlate = slates.find(s => s.slate_id === selectedSlateId);

  // Auto-select main slate if none selected
  useEffect(() => {
    if (slates.length > 0 && !selectedSlateId) {
      // Find the main slate (highest total payouts)
      const mainSlate = slates.reduce((max, slate) =>
        slate.total_payouts > max.total_payouts ? slate : max
      );
      if (mainSlate) {
        onSlateChange(mainSlate);
      }
    }
  }, [slates.length, selectedSlateId]); // Remove onSlateChange from dependencies to prevent infinite loop

  // Filter slates by site
  const siteSlates = slates.filter(slate => slate.site === selectedSite);

  // Group slates by date/type for better organization
  const groupedSlates = siteSlates.reduce(
    (groups, slate) => {
      const dateKey = slate.start_time.includes('Sun')
        ? 'Sunday'
        : slate.start_time.includes('Thu')
          ? 'Thursday'
          : slate.start_time.includes('Mon')
            ? 'Monday'
            : 'Other';

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(slate);
      return groups;
    },
    {} as Record<string, ComprehensiveSlate[]>
  );

  const handleSlateSelect = (slate: ComprehensiveSlate) => {
    onSlateChange(slate);
    setIsSlateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className='flex items-center space-x-4 animate-pulse'>
        <div className='h-8 w-32 bg-gray-200 rounded'></div>
        <div className='h-8 w-48 bg-gray-200 rounded'></div>
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center justify-between', className)}>
      {/* Left Section - Site Selector (RotoWire Style) */}
      <div className='flex items-center space-x-4'>
        <div className='relative'>
          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value as 'DraftKings' | 'FanDuel')}
            aria-label='Select DFS site'
            className='appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='DraftKings'>🏆 DraftKings</option>
            <option value='FanDuel'>📊 FanDuel</option>
          </select>
          <ChevronDownIcon className='absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none' />
        </div>

        {/* Current Slate Display */}
        <div className='flex items-center space-x-3'>
          <div className='text-sm text-gray-600'>
            <span className='font-semibold'>All</span>{' '}
            {selectedSlate?.start_time || 'Loading...'}
          </div>

          <button
            onClick={() => setIsSlateModalOpen(true)}
            className='text-blue-600 hover:text-blue-700 text-sm font-medium underline'
            disabled={slates.length === 0}
          >
            Change Slate
          </button>

          {selectedSlate && (
            <div className='flex items-center space-x-2 text-xs text-gray-500'>
              <span>{selectedSlate.contest_count} contests</span>
              <span>•</span>
              <span>${(selectedSlate.total_payouts / 1000000).toFixed(1)}M prizes</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Quick Stats */}
      <div className='flex items-center space-x-4 text-xs text-gray-500'>
        <div className='flex items-center space-x-1'>
          <ClockIcon className='w-4 h-4' />
          <span>Updated {new Date().toLocaleTimeString()}</span>
        </div>
        <div className='flex items-center space-x-1'>
          <TrophyIcon className='w-4 h-4' />
          <span>{slates.length} slates</span>
        </div>
      </div>

      {/* Change Slate Modal (RotoWire Style) */}
      {isSlateModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden mx-4'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <div className='flex justify-between items-center'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Select {selectedSite} Slate
                </h3>
                <button
                  onClick={() => setIsSlateModalOpen(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              <div className='mt-2 text-sm text-gray-600'>
                Choose from {siteSlates.length} comprehensive future slates
              </div>
            </div>

            <div className='overflow-y-auto max-h-96'>
              {Object.entries(groupedSlates).map(([dateGroup, groupSlates]) => (
                <div key={dateGroup} className='border-b border-gray-100'>
                  <div className='px-6 py-3 bg-gray-50'>
                    <h4 className='font-medium text-gray-900'>{dateGroup} Slates</h4>
                  </div>

                  <div className='divide-y divide-gray-100'>
                    {groupSlates.map(slate => (
                      <button
                        key={slate.slate_id}
                        onClick={() => handleSlateSelect(slate)}
                        className={clsx(
                          'w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors',
                          selectedSlateId === slate.slate_id
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : ''
                        )}
                      >
                        <div className='flex justify-between items-start'>
                          <div className='flex-1'>
                            <h5 className='font-medium text-gray-900 mb-1'>
                              {slate.name}
                            </h5>

                            <div className='flex items-center space-x-4 text-sm text-gray-600 mb-2'>
                              <span className='flex items-center'>
                                <ClockIcon className='w-4 h-4 mr-1' />
                                {slate.start_time}
                              </span>
                              <span className='flex items-center'>
                                <UsersIcon className='w-4 h-4 mr-1' />
                                {slate.contest_count.toLocaleString()} contests
                              </span>
                              <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs'>
                                {slate.game_type}
                              </span>
                            </div>

                            <div className='grid grid-cols-3 gap-4 text-xs text-gray-500'>
                              <div>
                                <span className='font-medium'>Entry:</span> $
                                {slate.entry_fee}
                              </div>
                              <div>
                                <span className='font-medium'>Entries:</span>{' '}
                                {slate.total_entries.toLocaleString()}
                              </div>
                              <div>
                                <span className='font-medium'>Max Entry:</span> $
                                {slate.max_entry_fee}
                              </div>
                            </div>

                            {slate.risk_analysis && (
                              <div className='mt-2 flex items-center space-x-2'>
                                <span
                                  className={clsx(
                                    'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                                    slate.risk_analysis === 'low'
                                      ? 'bg-green-100 text-green-800'
                                      : slate.risk_analysis === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  )}
                                >
                                  Risk: {slate.risk_analysis}
                                </span>

                                {slate.trending_score && slate.trending_score > 25 && (
                                  <span className='bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs'>
                                    🔥 Trending
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className='text-right ml-4'>
                            <div className='text-xl font-bold text-green-600'>
                              ${(slate.total_payouts / 1000000).toFixed(1)}M
                            </div>
                            <div className='text-xs text-gray-500'>Total Prizes</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className='px-6 py-4 border-t border-gray-200 bg-gray-50'>
              <div className='text-xs text-gray-500 text-center'>
                Comprehensive slate data • Enhanced with MCP analytics • Updated every 5
                minutes
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
