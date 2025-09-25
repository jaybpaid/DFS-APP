'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  HomeIcon,
  UserGroupIcon,
  CogIcon,
  LockClosedIcon,
  XMarkIcon,
  HeartIcon,
  ChartBarIcon,
  PlayIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

// RotoWire-style interfaces
interface RotoWirePlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  salary: number;
  fpts: number; // Fantasy points projection
  value: number; // Value rating
  minExp: number; // Minimum exposure
  maxExp: number; // Maximum exposure
  rst: number; // Rest percentage
  isLocked: boolean;
  isExcluded: boolean;
  isLiked: boolean;
  gameTime: string;
}

interface GameSlate {
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  isLive: boolean;
}

export default function RotoWireClonePage() {
  const [lineupCount, setLineupCount] = useState(2);
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [customView, setCustomView] = useState(false);

  // Mock RotoWire-style data
  const gameSlates: GameSlate[] = [
    { homeTeam: 'ATL', awayTeam: 'CAR', gameTime: '1:00PM ET', isLive: false },
    { homeTeam: 'GB', awayTeam: 'CLE', gameTime: '1:00PM ET', isLive: false },
    { homeTeam: 'HOU', awayTeam: 'JAX', gameTime: '1:00PM ET', isLive: false },
    { homeTeam: 'CIN', awayTeam: 'MIN', gameTime: '1:00PM ET', isLive: false },
    { homeTeam: 'PIT', awayTeam: 'NE', gameTime: '1:00PM ET', isLive: false },
    { homeTeam: 'LAR', awayTeam: 'PHI', gameTime: '1:00PM ET', isLive: false },
    { homeTeam: 'NYJ', awayTeam: 'TB', gameTime: '1:00PM ET', isLive: false },
    { homeTeam: 'IND', awayTeam: 'TEN', gameTime: '1:00PM ET', isLive: false },
    { homeTeam: 'LV', awayTeam: 'WAS', gameTime: '1:00PM ET', isLive: false },
    { homeTeam: 'DEN', awayTeam: 'LAC', gameTime: '4:05PM ET', isLive: false },
    { homeTeam: 'NO', awayTeam: 'SEA', gameTime: '4:25PM ET', isLive: false },
    { homeTeam: 'DAL', awayTeam: 'CHI', gameTime: '4:25PM ET', isLive: false },
    { homeTeam: 'ARI', awayTeam: 'SF', gameTime: '4:25PM ET', isLive: false },
  ];

  const mockPlayers: RotoWirePlayer[] = [
    {
      id: 'p1',
      name: 'Saquon Barkley',
      position: 'RB',
      team: 'PHI',
      opponent: 'LAR',
      salary: 7800,
      fpts: 23.25,
      value: 2.98,
      minExp: 0,
      maxExp: 100,
      rst: 11.5,
      isLocked: false,
      isExcluded: false,
      isLiked: false,
      gameTime: '1:00PM ET',
    },
    {
      id: 'p2',
      name: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      opponent: 'ARI',
      salary: 8200,
      fpts: 23.04,
      value: 2.81,
      minExp: 0,
      maxExp: 100,
      rst: 16.1,
      isLocked: false,
      isExcluded: false,
      isLiked: false,
      gameTime: '4:25PM ET',
    },
    {
      id: 'p3',
      name: 'Jalen Hurts',
      position: 'QB',
      team: 'PHI',
      opponent: 'LAR',
      salary: 6800,
      fpts: 22.93,
      value: 3.37,
      minExp: 0,
      maxExp: 100,
      rst: 17.4,
      isLocked: false,
      isExcluded: false,
      isLiked: false,
      gameTime: '1:00PM ET',
    },
    {
      id: 'p4',
      name: 'Jayden Daniels',
      position: 'QB',
      team: 'WAS',
      opponent: 'LV',
      salary: 7000,
      fpts: 22.51,
      value: 3.22,
      minExp: 0,
      maxExp: 100,
      rst: 12.5,
      isLocked: false,
      isExcluded: false,
      isLiked: false,
      gameTime: '1:00PM ET',
    },
  ];

  const lineupCountOptions = [1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150];
  const positions = ['All', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'DST'];

  const handlePlayerAction = (
    playerId: string,
    action: 'lock' | 'exclude' | 'like'
  ) => {
    // Handle player actions
    console.log(`${action} player ${playerId}`);
    toast.success(`Player ${action}ed successfully`);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* RotoWire-style Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-8'>
              <h1 className='text-2xl font-bold text-gray-900'>NFL Lineup Optimizer</h1>
              <div className='flex items-center space-x-2'>
                <img src='/draftkings-logo.png' alt='DraftKings' className='h-6 w-6' />
                <select className='border border-gray-300 rounded px-3 py-1 text-sm'>
                  <option>DraftKings</option>
                  <option>FanDuel</option>
                </select>
                <button className='text-blue-600 text-sm hover:text-blue-800'>
                  Change Slate
                </button>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-600'>All September 21st</span>
              <div className='flex items-center space-x-2'>
                <input type='checkbox' className='rounded' />
                <span className='text-sm text-gray-700'>
                  Using RotoWire Projections
                </span>
                <button className='text-blue-600 text-sm hover:text-blue-800'>
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <nav className='flex space-x-8'>
            <button className='flex items-center space-x-2 py-4 px-1 border-b-2 border-blue-500 text-blue-600'>
              <HomeIcon className='w-4 h-4' />
              <span className='font-medium'>Home</span>
            </button>
            <button className='flex items-center space-x-2 py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700'>
              <UserGroupIcon className='w-4 h-4' />
              <span className='font-medium'>Lineups</span>
            </button>
            <button className='flex items-center space-x-2 py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700'>
              <CogIcon className='w-4 h-4' />
              <span className='font-medium'>Customizations</span>
              <span className='bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full'>
                5 of 30
              </span>
            </button>
          </nav>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Hero Section - RotoWire Style */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 mb-8 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-4xl font-bold mb-4'>
                Build{' '}
                <span className='bg-white text-blue-600 px-3 py-1 rounded'>
                  {lineupCount}
                </span>{' '}
                Optimal Lineups
              </h2>

              {/* Lineup Count Selector */}
              <div className='flex items-center space-x-2 mb-6'>
                {lineupCountOptions.map(count => (
                  <button
                    key={count}
                    onClick={() => setLineupCount(count)}
                    className={clsx(
                      'px-4 py-2 rounded font-medium transition-colors',
                      lineupCount === count
                        ? 'bg-white text-blue-600'
                        : 'bg-blue-700 text-white hover:bg-blue-600'
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <button className='bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg'>
                Build {lineupCount} Lineups
              </button>
            </div>

            <div className='bg-white/10 backdrop-blur rounded-lg p-6'>
              <div className='flex items-center space-x-2 mb-2'>
                <BoltIcon className='w-5 h-5' />
                <span className='font-semibold'>Customize The Optimizer</span>
              </div>
              <p className='text-blue-100 text-sm mb-4'>
                Try stacks, groups, exposures, & much more
              </p>
              <button className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center space-x-2'>
                <PlayIcon className='w-4 h-4' />
                <span>Learn How To Use The Optimizer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Game Slate Display */}
        <div className='bg-white rounded-lg shadow mb-8 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              All <span className='text-blue-600'>September 21st</span> •{' '}
              <span className='text-green-600'>13 games</span>
            </h3>
            <button className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
              Change Slate
            </button>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-13 gap-4'>
            {gameSlates.map((game, index) => (
              <div key={index} className='text-center'>
                <div className='text-xs text-gray-500 mb-1'>{game.gameTime}</div>
                <div className='space-y-1'>
                  <div className='flex items-center justify-center space-x-1'>
                    <span className='text-xs'>▲</span>
                    <span className='font-medium text-sm'>{game.awayTeam}</span>
                  </div>
                  <div className='flex items-center justify-center space-x-1'>
                    <span className='text-xs'>●</span>
                    <span className='font-medium text-sm'>{game.homeTeam}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Table */}
        <div className='bg-white rounded-lg shadow'>
          {/* Position Filters */}
          <div className='border-b border-gray-200 p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <span className='text-sm font-medium text-gray-700'>Quick Search</span>
                <div className='flex items-center space-x-2'>
                  {positions.map(pos => (
                    <button
                      key={pos}
                      onClick={() => setSelectedPosition(pos)}
                      className={clsx(
                        'px-3 py-1 rounded text-sm font-medium',
                        selectedPosition === pos
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                <button className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700'>
                  Add Filter
                </button>
              </div>

              <div className='flex items-center space-x-4'>
                <button
                  onClick={() => setCustomView(!customView)}
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                >
                  Custom View ▼
                </button>
                <button className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                  📝 Edit
                </button>
                <button className='text-gray-600 hover:text-gray-800 text-sm'>
                  ❓
                </button>
              </div>
            </div>
          </div>

          {/* Player Table Header */}
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    PLAYER
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    LOCK
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    EXC
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    LIKE
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    POS
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    TEAM
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    OPP
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    SAL
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    FPTS
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    VAL
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    MIN EXP
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    MAX EXP
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    RST%
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {mockPlayers
                  .filter(
                    player =>
                      selectedPosition === 'All' || player.position === selectedPosition
                  )
                  .map(player => (
                    <tr key={player.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='font-medium text-gray-900'>{player.name}</div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center'>
                        <button
                          onClick={() => handlePlayerAction(player.id, 'lock')}
                          className={clsx(
                            'w-6 h-6 rounded',
                            player.isLocked
                              ? 'bg-yellow-400'
                              : 'bg-gray-200 hover:bg-yellow-200'
                          )}
                        >
                          {player.isLocked ? '🔒' : ''}
                        </button>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center'>
                        <button
                          onClick={() => handlePlayerAction(player.id, 'exclude')}
                          className={clsx(
                            'w-6 h-6 rounded',
                            player.isExcluded
                              ? 'bg-red-400'
                              : 'bg-gray-200 hover:bg-red-200'
                          )}
                        >
                          {player.isExcluded ? '❌' : ''}
                        </button>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center'>
                        <button
                          onClick={() => handlePlayerAction(player.id, 'like')}
                          className={clsx(
                            'w-6 h-6 rounded',
                            player.isLiked
                              ? 'bg-blue-400'
                              : 'bg-gray-200 hover:bg-blue-200'
                          )}
                        >
                          {player.isLiked ? '👍' : ''}
                        </button>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center text-sm font-medium'>
                        {player.position}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center text-sm font-medium'>
                        {player.team}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600'>
                        @{player.opponent}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center text-sm font-medium'>
                        ${player.salary.toLocaleString()}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center text-sm font-bold text-blue-600'>
                        {player.fpts.toFixed(2)}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center text-sm font-medium'>
                        {player.value.toFixed(2)}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center'>
                        <input
                          type='number'
                          value={player.minExp}
                          className='w-12 text-center text-xs border border-gray-300 rounded px-1 py-0.5'
                          min='0'
                          max='100'
                        />
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center'>
                        <input
                          type='number'
                          value={player.maxExp}
                          className='w-12 text-center text-xs border border-gray-300 rounded px-1 py-0.5'
                          min='0'
                          max='100'
                        />
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-center text-sm'>
                        {player.rst.toFixed(1)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
