import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function PortfolioPage() {
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>Portfolio Manager</h1>
          <p className='text-gray-600 mt-1'>
            Track exposures, correlations, and portfolio optimization
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Portfolio Overview */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Portfolio Summary</h2>

            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Total Lineups:</span>
                <span className='font-semibold'>150</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>Total Investment:</span>
                <span className='font-semibold'>$3,300</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>Expected ROI:</span>
                <span className='font-semibold text-green-600'>+18.5%</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>Sharpe Ratio:</span>
                <span className='font-semibold'>1.34</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>Max Exposure:</span>
                <span className='font-semibold'>22%</span>
              </div>
            </div>
          </Card>

          {/* Player Exposures */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Top Player Exposures</h2>

            <div className='space-y-3'>
              {[
                { player: 'Josh Allen', exposure: 22, target: 20 },
                { player: 'Tyreek Hill', exposure: 18, target: 15 },
                { player: 'Travis Kelce', exposure: 16, target: 18 },
                { player: 'Stefon Diggs', exposure: 14, target: 12 },
                { player: 'Tua Tagovailoa', exposure: 12, target: 10 },
              ].map(item => (
                <div key={item.player} className='flex justify-between items-center'>
                  <span className='font-medium'>{item.player}</span>
                  <div className='flex items-center space-x-2'>
                    <span
                      className={`text-sm ${item.exposure > item.target ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {item.exposure}%
                    </span>
                    <Badge variant='outline' className='text-xs'>
                      Target: {item.target}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Stack Analysis */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Stack Distribution</h2>

            <div className='space-y-3'>
              {[
                { stack: 'BUF Pass', count: 34, percent: 22.7 },
                { stack: 'MIA Pass', count: 28, percent: 18.7 },
                { stack: 'KC Pass', count: 24, percent: 16.0 },
                { stack: 'RB/DST', count: 18, percent: 12.0 },
              ].map(stack => (
                <div key={stack.stack} className='flex justify-between items-center'>
                  <span className='font-medium'>{stack.stack}</span>
                  <div className='text-right'>
                    <div className='font-semibold'>{stack.count}</div>
                    <div className='text-sm text-gray-600'>{stack.percent}%</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Detailed Exposure Table */}
        <div className='mt-8'>
          <Card className='p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-xl font-semibold'>Detailed Player Exposures</h3>
              <div className='flex space-x-2'>
                <Button variant='outline' size='sm'>
                  Export
                </Button>
                <Button variant='outline' size='sm'>
                  Rebalance
                </Button>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left p-3'>Player</th>
                    <th className='text-left p-3'>Position</th>
                    <th className='text-left p-3'>Team</th>
                    <th className='text-left p-3'>Current Exposure</th>
                    <th className='text-left p-3'>Target Exposure</th>
                    <th className='text-left p-3'>Variance</th>
                    <th className='text-left p-3'>Expected Value</th>
                    <th className='text-left p-3'>Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      player: 'Josh Allen',
                      pos: 'QB',
                      team: 'BUF',
                      current: 22,
                      target: 20,
                      variance: '+2',
                      ev: '$1,247',
                      risk: 'Medium',
                    },
                    {
                      player: 'Tyreek Hill',
                      pos: 'WR',
                      team: 'MIA',
                      current: 18,
                      target: 15,
                      variance: '+3',
                      ev: '$892',
                      risk: 'High',
                    },
                    {
                      player: 'Travis Kelce',
                      pos: 'TE',
                      team: 'KC',
                      current: 16,
                      target: 18,
                      variance: '-2',
                      ev: '$756',
                      risk: 'Low',
                    },
                  ].map((player, index) => (
                    <tr key={index} className='border-t hover:bg-gray-50'>
                      <td className='p-3 font-medium'>{player.player}</td>
                      <td className='p-3'>{player.pos}</td>
                      <td className='p-3'>{player.team}</td>
                      <td className='p-3'>{player.current}%</td>
                      <td className='p-3'>{player.target}%</td>
                      <td
                        className={`p-3 ${player.variance.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {player.variance}%
                      </td>
                      <td className='p-3'>{player.ev}</td>
                      <td className='p-3'>
                        <Badge
                          variant={
                            player.risk === 'High'
                              ? 'destructive'
                              : player.risk === 'Medium'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {player.risk}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
