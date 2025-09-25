import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function ResearchPage() {
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>Research Center</h1>
          <p className='text-gray-600 mt-1'>
            Advanced player analysis and data exploration
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Research Tools */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Research Tools</h2>

            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='player-search'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Player Search
                </label>
                <Input
                  id='player-search'
                  placeholder='Search players...'
                  className='w-full'
                />
              </div>

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
                  <option>Buffalo Bills</option>
                  <option>Miami Dolphins</option>
                  <option>Kansas City Chiefs</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor='position-filter'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Position
                </label>
                <select
                  id='position-filter'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                >
                  <option>All Positions</option>
                  <option>QB</option>
                  <option>RB</option>
                  <option>WR</option>
                  <option>TE</option>
                </select>
              </div>

              <Button className='w-full bg-green-600 hover:bg-green-700'>
                Export CSV
              </Button>
            </div>
          </Card>

          {/* Data Table */}
          <div className='lg:col-span-3'>
            <Card className='p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>Player Research Data</h2>
                <div className='flex space-x-2'>
                  <Button variant='outline' size='sm'>
                    Parquet
                  </Button>
                  <Button variant='outline' size='sm'>
                    CSV
                  </Button>
                </div>
              </div>

              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='text-left p-3'>Player</th>
                      <th className='text-left p-3'>Team</th>
                      <th className='text-left p-3'>Pos</th>
                      <th className='text-left p-3'>Salary</th>
                      <th className='text-left p-3'>Proj</th>
                      <th className='text-left p-3'>Own%</th>
                      <th className='text-left p-3'>Ceiling</th>
                      <th className='text-left p-3'>Floor</th>
                      <th className='text-left p-3'>Leverage</th>
                      <th className='text-left p-3'>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: 'Josh Allen',
                        team: 'BUF',
                        pos: 'QB',
                        salary: 8800,
                        proj: 24.2,
                        own: 18.5,
                        ceil: 32.1,
                        floor: 16.8,
                        leverage: 1.24,
                        value: 2.75,
                      },
                      {
                        name: 'Tyreek Hill',
                        team: 'MIA',
                        pos: 'WR',
                        salary: 8200,
                        proj: 19.8,
                        own: 22.1,
                        ceil: 28.4,
                        floor: 11.2,
                        leverage: 0.89,
                        value: 2.41,
                      },
                      {
                        name: 'Travis Kelce',
                        team: 'KC',
                        pos: 'TE',
                        salary: 7000,
                        proj: 16.4,
                        own: 15.7,
                        ceil: 24.8,
                        floor: 8.1,
                        leverage: 1.05,
                        value: 2.34,
                      },
                    ].map((player, index) => (
                      <tr key={index} className='border-t hover:bg-gray-50'>
                        <td className='p-3 font-medium'>{player.name}</td>
                        <td className='p-3'>{player.team}</td>
                        <td className='p-3'>{player.pos}</td>
                        <td className='p-3'>${player.salary.toLocaleString()}</td>
                        <td className='p-3'>{player.proj}</td>
                        <td className='p-3'>{player.own}%</td>
                        <td className='p-3'>{player.ceil}</td>
                        <td className='p-3'>{player.floor}</td>
                        <td className='p-3'>{player.leverage}</td>
                        <td className='p-3'>{player.value}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* Correlation Matrix */}
        <div className='mt-8'>
          <Card className='p-6'>
            <h3 className='text-xl font-semibold mb-4'>Correlation Matrix</h3>
            <div className='h-64 bg-gray-100 rounded flex items-center justify-center'>
              <span className='text-gray-500'>Interactive Correlation Heatmap</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
