import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function LivePage() {
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>Live Dashboard</h1>
          <p className='text-gray-600 mt-1'>Real-time scoring and lineup tracking</p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Live Scores */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Live Scores</h2>
            <div className='space-y-3'>
              {['BUF @ MIA', 'KC @ DEN', 'LAR @ SF'].map(game => (
                <div
                  key={game}
                  className='flex justify-between items-center p-3 bg-gray-50 rounded'
                >
                  <span className='font-medium'>{game}</span>
                  <Badge variant='outline'>Q3 8:24</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Performers */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Top Performers</h2>
            <div className='space-y-3'>
              {[
                { player: 'Josh Allen', points: 24.8, trend: 'up' },
                { player: 'Tyreek Hill', points: 19.3, trend: 'up' },
                { player: 'Travis Kelce', points: 16.2, trend: 'down' },
              ].map(player => (
                <div key={player.player} className='flex justify-between items-center'>
                  <span className='font-medium'>{player.player}</span>
                  <span
                    className={`font-semibold ${player.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {player.points} pts
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Lineup Status */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Your Lineups</h2>
            <div className='space-y-3'>
              {[1, 2, 3].map(lineup => (
                <div key={lineup} className='p-3 bg-gray-50 rounded'>
                  <div className='flex justify-between mb-2'>
                    <span className='font-medium'>Lineup {lineup}</span>
                    <Badge variant='default'>Live</Badge>
                  </div>
                  <div className='text-sm text-gray-600'>Current Score: 87.4 pts</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
