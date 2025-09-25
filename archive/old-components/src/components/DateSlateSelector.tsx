import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDaysIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  nowChi,
  getTodayISO,
  validateDate,
  formatSlateDate,
  getSlateStatus,
  isPastSlate,
} from '../utils/time-helpers';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export interface SlateSelection {
  date: string; // YYYY-MM-DD
  sport: 'NFL' | 'NBA';
  site: 'DK' | 'FD';
  slateId?: string;
}

interface Slate {
  id: string;
  name: string;
  sport: string;
  site: string;
  start_time: string;
  entry_fee: number;
  total_payouts: number;
  contest_count?: number;
  games_count?: number;
  salary_cap?: number;
}

interface DateSlateSelectorProps {
  value: SlateSelection;
  onChange: (selection: SlateSelection) => void;
  className?: string;
}

export default function DateSlateSelector({
  value,
  onChange,
  className,
}: DateSlateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch slates for selected date/sport/site
  const {
    data: slateData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['slates', value.date, value.sport, value.site],
    queryFn: async () => {
      // Validate date before API call
      const validation = validateDate(value.date);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid date');
        onChange({ ...value, date: validation.correctedDate });
        return null;
      }

      const params = new URLSearchParams({
        date: value.date,
        sport: value.sport,
        site: value.site,
      });

      const response = await fetch(`http://localhost:8000/api/slates?${params}`);

      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.code === 'PAST_DATE_BLOCKED') {
          toast.error('Past slates are hidden. Showing **Today** instead.');
          onChange({ ...value, date: errorData.nextValid });
          return null;
        }
      }

      if (!response.ok) throw new Error('Failed to fetch slates');
      const data = await response.json();

      // Filter out any past slates client-side as additional safety
      const futureSlates =
        data.slates?.filter((slate: Slate) => !isPastSlate(slate)) || [];

      return {
        ...data,
        slates: futureSlates,
      };
    },
    enabled: !!value.date,
    refetchInterval: 60000, // Refresh every minute
  });

  const slates: Slate[] = slateData?.slates || [];
  const selectedSlate = slates.find(s => s.id === value.slateId);

  // Auto-select first slate if none selected
  useEffect(() => {
    if (slates.length > 0 && !value.slateId) {
      onChange({ ...value, slateId: slates[0].id });
    }
  }, [slates, value, onChange]);

  // Validate current date on mount
  useEffect(() => {
    const validation = validateDate(value.date);
    if (!validation.isValid) {
      onChange({ ...value, date: validation.correctedDate });
      toast.error(validation.error || 'Date corrected to today');
    }
  }, []);

  const handleDateChange = (newDate: string) => {
    const validation = validateDate(newDate);
    if (!validation.isValid) {
      toast.error(validation.error || 'Past dates not allowed');
      return;
    }
    onChange({ ...value, date: newDate, slateId: undefined });
  };

  const handleSportChange = (sport: 'NFL' | 'NBA') => {
    onChange({ ...value, sport, slateId: undefined });
  };

  const handleSiteChange = (site: 'DK' | 'FD') => {
    onChange({ ...value, site, slateId: undefined });
  };

  const handleSlateChange = (slateId: string) => {
    onChange({ ...value, slateId });
    setIsOpen(false);
  };

  return (
    <div className={clsx('flex items-center space-x-4', className)}>
      {/* Date Picker */}
      <div className='relative'>
        <div className='flex items-center space-x-2'>
          <CalendarDaysIcon className='w-5 h-5 text-gray-400' />
          <input
            type='date'
            value={value.date}
            min={getTodayISO()}
            onChange={e => handleDateChange(e.target.value)}
            className='border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Select date (Today or Future)'
          />
        </div>
      </div>

      {/* Sport Toggle */}
      <div className='flex rounded-md border border-gray-300 overflow-hidden'>
        <button
          onClick={() => handleSportChange('NFL')}
          className={clsx(
            'px-3 py-2 text-sm font-medium',
            value.sport === 'NFL'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          )}
        >
          NFL
        </button>
        <button
          onClick={() => handleSportChange('NBA')}
          className={clsx(
            'px-3 py-2 text-sm font-medium border-l border-gray-300',
            value.sport === 'NBA'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          )}
        >
          NBA
        </button>
      </div>

      {/* Site Toggle */}
      <div className='flex rounded-md border border-gray-300 overflow-hidden'>
        <button
          onClick={() => handleSiteChange('DK')}
          className={clsx(
            'px-3 py-2 text-sm font-medium',
            value.site === 'DK'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          )}
        >
          DK
        </button>
        <button
          onClick={() => handleSiteChange('FD')}
          className={clsx(
            'px-3 py-2 text-sm font-medium border-l border-gray-300',
            value.site === 'FD'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          )}
        >
          FD
        </button>
      </div>

      {/* Slate Selector */}
      <div className='relative'>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading || slates.length === 0}
          className={clsx(
            'flex items-center justify-between min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded-md bg-white',
            isLoading || slates.length === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
          )}
        >
          <span className='truncate'>
            {isLoading
              ? 'Loading slates...'
              : selectedSlate
                ? selectedSlate.name
                : slates.length === 0
                  ? 'No future slates found'
                  : 'Select slate'}
          </span>
          <ChevronDownIcon className='w-4 h-4 ml-2 flex-shrink-0' />
        </button>

        {isOpen && slates.length > 0 && (
          <div className='absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto'>
            {slates.map(slate => {
              const status = getSlateStatus(slate);
              return (
                <button
                  key={slate.id}
                  onClick={() => handleSlateChange(slate.id)}
                  className='w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0'
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <div className='font-medium text-gray-900'>{slate.name}</div>
                      <div className='text-xs text-gray-500 mt-1'>
                        {formatSlateDate(slate.start_time)} • ${slate.entry_fee} entry
                      </div>
                      {slate.games_count && (
                        <div className='text-xs text-gray-400 mt-1'>
                          {slate.games_count} games • $
                          {(slate.total_payouts / 1000000).toFixed(1)}M prizes
                        </div>
                      )}
                    </div>
                    <div className='ml-2'>
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          {
                            'bg-green-100 text-green-800': status === 'UPCOMING',
                            'bg-blue-100 text-blue-800': status === 'LIVE',
                            'bg-yellow-100 text-yellow-800': status === 'LOCKED',
                            'bg-gray-100 text-gray-800': status === 'COMPLETE',
                          }
                        )}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className='flex items-center space-x-2'>
        {slates.length === 0 && !isLoading && (
          <div className='text-xs text-gray-500'>
            <button
              onClick={() => onChange({ ...value, date: getTodayISO() })}
              className='text-blue-600 hover:text-blue-700 underline'
            >
              Jump to Today
            </button>
          </div>
        )}

        {selectedSlate && (
          <div className='text-xs text-gray-500'>
            Last updated: {nowChi().toFormat('h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
}
