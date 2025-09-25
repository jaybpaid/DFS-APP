import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, DollarSign, Trophy, BarChart3 } from 'lucide-react';

interface SimulationResultsProps {
  results: any;
}

export function SimulationResults({ results }: SimulationResultsProps) {
  // Mock simulation results structure
  const simulationData = {
    totalSimulations: results?.totalSimulations || 100000,
    avgScore: results?.avgScore || 142.3,
    medianScore: results?.medianScore || 138.7,
    topPercentileScore: results?.topPercentileScore || 187.2,
    cashRate: results?.cashRate || 68.5,
    binRate: results?.binRate || 12.3,
    roi: results?.roi || 15.7,
    lineup_analysis: results?.lineup_analysis || [],
  };

  return (
    <div className='space-y-6'>
      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='bg-gray-900 border-gray-800'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-400'>
              Cash Rate
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-green-400' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-400'>
              {simulationData.cashRate.toFixed(1)}%
            </div>
            <Progress value={simulationData.cashRate} className='mt-2' />
          </CardContent>
        </Card>

        <Card className='bg-gray-900 border-gray-800'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-400'>
              Bink Rate
            </CardTitle>
            <Trophy className='h-4 w-4 text-yellow-400' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-400'>
              {simulationData.binRate.toFixed(1)}%
            </div>
            <Progress value={simulationData.binRate} className='mt-2' />
          </CardContent>
        </Card>

        <Card className='bg-gray-900 border-gray-800'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-400'>
              Projected ROI
            </CardTitle>
            <DollarSign className='h-4 w-4 text-blue-400' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-400'>
              {simulationData.roi > 0 ? '+' : ''}
              {simulationData.roi.toFixed(1)}%
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Based on {simulationData.totalSimulations.toLocaleString()} simulations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className='bg-gray-900 border-gray-800'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='w-5 h-5 text-purple-400' />
            Score Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-white'>
                {simulationData.avgScore.toFixed(1)}
              </div>
              <div className='text-sm text-gray-400'>Average</div>
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold text-white'>
                {simulationData.medianScore.toFixed(1)}
              </div>
              <div className='text-sm text-gray-400'>Median</div>
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold text-green-400'>
                {simulationData.topPercentileScore.toFixed(1)}
              </div>
              <div className='text-sm text-gray-400'>90th Percentile</div>
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-400'>
                {(simulationData.topPercentileScore + 15).toFixed(1)}
              </div>
              <div className='text-sm text-gray-400'>Ceiling</div>
            </div>
          </div>

          {/* Score ranges */}
          <div className='mt-6 space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>150+ Points</span>
              <div className='flex items-center gap-2'>
                <Progress value={25} className='w-24' />
                <span className='text-sm text-white'>25%</span>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>140-149 Points</span>
              <div className='flex items-center gap-2'>
                <Progress value={35} className='w-24' />
                <span className='text-sm text-white'>35%</span>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>130-139 Points</span>
              <div className='flex items-center gap-2'>
                <Progress value={28} className='w-24' />
                <span className='text-sm text-white'>28%</span>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>Under 130 Points</span>
              <div className='flex items-center gap-2'>
                <Progress value={12} className='w-24' />
                <span className='text-sm text-white'>12%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lineup Performance */}
      <Card className='bg-gray-900 border-gray-800'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Target className='w-5 h-5 text-green-400' />
            Top Performing Lineups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3, 4, 5].map(rank => (
              <div
                key={rank}
                className='flex items-center justify-between p-3 bg-gray-800 rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <Badge variant={rank === 1 ? 'default' : 'secondary'}>#{rank}</Badge>
                  <div>
                    <div className='font-medium text-white'>Lineup {rank}</div>
                    <div className='text-sm text-gray-400'>
                      Avg Score: {(simulationData.avgScore + (6 - rank) * 3).toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className='text-right'>
                  <div className='text-sm text-green-400'>
                    {(simulationData.cashRate + (6 - rank) * 2).toFixed(1)}% Cash
                  </div>
                  <div className='text-sm text-yellow-400'>
                    {(simulationData.binRate + (6 - rank) * 0.5).toFixed(1)}% Bink
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Methodology Note */}
      <Card className='bg-gray-900 border-gray-800'>
        <CardContent className='pt-6'>
          <div className='text-sm text-gray-400'>
            <p className='mb-2'>
              <strong className='text-gray-300'>Simulation Methodology:</strong>
            </p>
            <ul className='list-disc list-inside space-y-1'>
              <li>
                Monte Carlo simulation with{' '}
                {simulationData.totalSimulations.toLocaleString()} iterations
              </li>
              <li>Variance modeling based on historical performance patterns</li>
              <li>Correlation adjustments for QB-WR stacks and game environments</li>
              <li>Contest type: GPP (Large field tournaments)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
