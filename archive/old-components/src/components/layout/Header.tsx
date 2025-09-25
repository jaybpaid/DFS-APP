import React from 'react';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import DateSlateSelector, { SlateSelection } from '../DateSlateSelector';
import { getTodayISO } from '../../utils/time-helpers';
import { useDfsStore } from '../../store/dfs-store';

export default function Header() {
  const { slateSelection, setSlateSelection } = useDfsStore();

  // Initialize with today's date if not set
  const currentSelection: SlateSelection = slateSelection || {
    date: getTodayISO(),
    sport: 'NFL',
    site: 'DK',
  };

  const handleSelectionChange = (selection: SlateSelection) => {
    setSlateSelection(selection);
  };

  return (
    <div className='relative z-10 flex-shrink-0 flex h-20 bg-white shadow-lg border-b border-gray-200'>
      <div className='flex-1 px-6 flex justify-between items-center'>
        {/* Left: Logo + Date/Slate Selector */}
        <div className='flex items-center space-x-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>DFS</span>
              </div>
            </div>
            <div className='ml-3'>
              <div className='text-gray-900 text-lg font-semibold'>
                DFS Optimizer Pro
              </div>
              <div className='text-gray-500 text-xs'>Production Edition</div>
            </div>
          </div>

          {/* Date/Slate Selector - Core of the header */}
          <div className='hidden lg:flex'>
            <DateSlateSelector
              value={currentSelection}
              onChange={handleSelectionChange}
              className='flex items-center'
            />
          </div>
        </div>

        {/* Right: Status + Actions */}
        <div className='flex items-center space-x-4'>
          {/* Selected Slate Summary */}
          {currentSelection.slateId && (
            <div className='hidden md:block text-right'>
              <div className='text-sm font-medium text-gray-900'>
                {currentSelection.sport} • {currentSelection.site}
              </div>
              <div className='text-xs text-gray-500'>
                {currentSelection.date} • TODAY+FUTURE Only
              </div>
            </div>
          )}

          {/* Notification Bell */}
          <button
            type='button'
            className='bg-white p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
          >
            <span className='sr-only'>View notifications</span>
            <BellIcon className='h-5 w-5' aria-hidden='true' />
          </button>

          {/* User Menu */}
          <div className='relative'>
            <button
              type='button'
              className='bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
            >
              <span className='sr-only'>Open user menu</span>
              <UserCircleIcon
                className='h-8 w-8 text-gray-400 hover:text-gray-500'
                aria-hidden='true'
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Date/Slate Selector */}
      <div className='lg:hidden px-6 py-3 bg-gray-50 border-t border-gray-200'>
        <DateSlateSelector
          value={currentSelection}
          onChange={handleSelectionChange}
          className='flex flex-wrap items-center gap-2'
        />
      </div>
    </div>
  );
}
