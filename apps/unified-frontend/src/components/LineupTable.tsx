import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DFSLineup } from '@/providers/DFSIntegrationProvider';
import {
  Target,
  DollarSign,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LineupTableProps {
  lineups: DFSLineup[];
}

export function LineupTable({ lineups }: LineupTableProps) {
  const [expandedLineup, setExpandedLineup] = useState<string | null>(null);

  const toggleExpanded = (lineupId: string) => {
    setExpandedLineup(expandedLineup === lineupId ? null : lineupId);
  };

  const getPositionOrder = (position: string) => {
    const order: Record<string, number> = {
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 4,
      K: 5,
      DST: 6, // NFL
      PG: 1,
      SG: 2,
      SF: 3,
      PF: 4,
      C: 5, // NBA
    };
    return order[position] || 99;
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'bg-purple-600',
      RB: 'bg-green-600',
      WR: 'bg-blue-600',
      TE: 'bg-orange-600',
      K: 'bg-gray-600',
      DST: 'bg-red-600',
      PG: 'bg-indigo-600',
      SG: 'bg-cyan-600',
      SF: 'bg-yellow-600',
      PF: 'bg-pink-600',
      C: 'bg-emerald-600',
    };
    return colors[position] || 'bg-gray-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className='space-y-4'>
      {lineups.map((lineup, index) => (
        <Card key={lineup.id} className='bg-gray-900 border-gray-800'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Target className='w-5 h-5 text-green-400' />
                Lineup {index + 1}
              </CardTitle>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => toggleExpanded(lineup.id)}
                className='flex items-center gap-1'
              >
                {expandedLineup === lineup.id ? (
                  <>
                    Hide Players <ChevronUp className='w-4 h-4' />
                  </>
                ) : (
                  <>
                    Show Players <ChevronDown className='w-4 h-4' />
                  </>
                )}
              </Button>
            </div>

            {/* Lineup Summary */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
              <div className='flex items-center gap-2'>
                <DollarSign className='w-4 h-4 text-green-400' />
                <div>
                  <div className='text-sm text-gray-400'>Salary</div>
                  <div className='font-semibold'>
                    {formatCurrency(lineup.totalSalary)}
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <TrendingUp className='w-4 h-4 text-blue-400' />
                <div>
                  <div className='text-sm text-gray-400'>Projection</div>
                  <div className='font-semibold'>
                    {lineup.projection.toFixed(1)} pts
                  </div>
                </div>
              </div>

              {lineup.ownership && (
                <div className='flex items-center gap-2'>
                  <Users className='w-4 h-4 text-purple-400' />
                  <div>
                    <div className='text-sm text-gray-400'>Ownership</div>
                    <div className='font-semibold'>{lineup.ownership.toFixed(1)}%</div>
                  </div>
                </div>
              )}

              {lineup.leverage && (
                <div className='flex items-center gap-2'>
                  <Target className='w-4 h-4 text-orange-400' />
                  <div>
                    <div className='text-sm text-gray-400'>Leverage</div>
                    <div className='font-semibold'>{lineup.leverage.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          {expandedLineup === lineup.id && (
            <CardContent className='pt-0'>
              <div className='space-y-3'>
                {lineup.players
                  .sort(
                    (a, b) =>
                      getPositionOrder(a.position) - getPositionOrder(b.position)
                  )
                  .map(player => (
                    <div
                      key={player.id}
                      className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <Badge
                          className={`${getPositionColor(player.position)} text-white`}
                        >
                          {player.position}
                        </Badge>
                        <div>
                          <div className='font-medium text-white'>{player.name}</div>
                          <div className='text-sm text-gray-400'>
                            {player.team}
                            {player.opponent && ` vs ${player.opponent}`}
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-6'>
                        <div className='text-right'>
                          <div className='text-sm text-gray-400'>Salary</div>
                          <div className='font-mono text-white'>
                            {formatCurrency(player.salary)}
                          </div>
                        </div>

                        <div className='text-right'>
                          <div className='text-sm text-gray-400'>Projection</div>
                          <div className='font-bold text-green-400'>
                            {player.projection.toFixed(1)}
                          </div>
                        </div>

                        {player.ownership && (
                          <div className='text-right'>
                            <div className='text-sm text-gray-400'>Own%</div>
                            <div className='text-purple-400'>
                              {player.ownership.toFixed(1)}%
                            </div>
                          </div>
                        )}

                        <div className='text-right'>
                          <div className='text-sm text-gray-400'>Value</div>
                          <div className='text-blue-400 font-medium'>
                            {((player.projection / player.salary) * 1000).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Lineup Analytics */}
              <div className='mt-6 pt-4 border-t border-gray-700'>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-400'>Avg Salary:</span>{' '}
                    <span className='text-white'>
                      {formatCurrency(lineup.totalSalary / lineup.players.length)}
                    </span>
                  </div>

                  <div>
                    <span className='text-gray-400'>Avg Projection:</span>{' '}
                    <span className='text-green-400'>
                      {(lineup.projection / lineup.players.length).toFixed(1)}
                    </span>
                  </div>

                  <div>
                    <span className='text-gray-400'>Value Score:</span>{' '}
                    <span className='text-blue-400'>
                      {((lineup.projection / lineup.totalSalary) * 1000).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {lineups.length === 0 && (
        <div className='text-center py-8 text-gray-400'>
          <Target className='w-12 h-12 mx-auto mb-4 opacity-50' />
          <p>No optimized lineups available</p>
          <p className='text-sm'>Generate lineups using the Optimizer tab</p>
        </div>
      )}
    </div>
  );
}
