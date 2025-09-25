import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function NewsPage() {
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>News & Updates</h1>
          <p className='text-gray-600 mt-1'>Real-time NFL news and player updates</p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* News Feed */}
          <div className='lg:col-span-2'>
            <Card className='p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>Live News Feed</h2>
                <Button variant='outline' size='sm'>
                  Refresh
                </Button>
              </div>

              <div className='space-y-4'>
                {[
                  {
                    title: 'Josh Allen ruled OUT for Thursday Night Football',
                    time: '2 minutes ago',
                    impact: 'high',
                    source: 'ESPN',
                    description:
                      'Bills QB Josh Allen has been ruled out with an ankle injury sustained in practice.',
                  },
                  {
                    title: 'Tyreek Hill questionable with hamstring injury',
                    time: '15 minutes ago',
                    impact: 'medium',
                    source: 'NFL Network',
                    description:
                      'Dolphins WR dealing with hamstring tightness, game-time decision expected.',
                  },
                  {
                    title: 'Weather alert: High winds expected in Denver',
                    time: '32 minutes ago',
                    impact: 'medium',
                    source: 'Weather.com',
                    description:
                      '30+ mph winds could affect passing game in Chiefs vs Broncos matchup.',
                  },
                ].map((news, index) => (
                  <div key={index} className='border-l-4 border-blue-500 pl-4 py-3'>
                    <div className='flex items-start justify-between mb-2'>
                      <h3 className='font-semibold text-gray-900'>{news.title}</h3>
                      <Badge
                        variant={
                          news.impact === 'high'
                            ? 'destructive'
                            : news.impact === 'medium'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {news.impact.toUpperCase()}
                      </Badge>
                    </div>
                    <p className='text-gray-600 text-sm mb-2'>{news.description}</p>
                    <div className='flex justify-between text-xs text-gray-500'>
                      <span>{news.source}</span>
                      <span>{news.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Filters & Alerts */}
          <div className='space-y-6'>
            <Card className='p-6'>
              <h2 className='text-xl font-semibold mb-4'>News Filters</h2>

              <div className='space-y-4'>
                <div>
                  <label
                    htmlFor='team-filter'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Team Filter
                  </label>
                  <select
                    id='team-filter'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                  >
                    <option>All Teams</option>
                    <option>My Players Only</option>
                    <option>Buffalo Bills</option>
                    <option>Miami Dolphins</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='impact-filter'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Impact Level
                  </label>
                  <select
                    id='impact-filter'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                  >
                    <option>All Impact Levels</option>
                    <option>High Impact Only</option>
                    <option>Medium & High</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='news-type'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    News Type
                  </label>
                  <select
                    id='news-type'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                  >
                    <option>All News</option>
                    <option>Injuries</option>
                    <option>Weather</option>
                    <option>Lineup Changes</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <h2 className='text-xl font-semibold mb-4'>Alert Settings</h2>

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Push Notifications</span>
                  <Button variant='outline' size='sm'>
                    Enable
                  </Button>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Email Alerts</span>
                  <Button variant='outline' size='sm'>
                    Configure
                  </Button>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>High Impact Only</span>
                  <Button variant='outline' size='sm'>
                    On
                  </Button>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <h2 className='text-xl font-semibold mb-4'>Player Watch List</h2>

              <div className='space-y-2'>
                {['Josh Allen', 'Tyreek Hill', 'Travis Kelce'].map(player => (
                  <div
                    key={player}
                    className='flex justify-between items-center p-2 bg-gray-50 rounded'
                  >
                    <span className='text-sm font-medium'>{player}</span>
                    <Badge variant='outline' className='text-xs'>
                      Watching
                    </Badge>
                  </div>
                ))}
              </div>

              <Button variant='outline' className='w-full mt-3'>
                Add Player
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
