import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function SimulationsPage() {
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>Monte Carlo Simulations</h1>
          <p className='text-gray-600 mt-1'>
            Advanced lineup simulation and variance analysis
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Simulation Controls */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Simulation Parameters</h2>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Iterations
                </label>
                <input
                  type='number'
                  defaultValue={10000}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Volatility Mode
                </label>
                <select className='w-full px-3 py-2 border border-gray-300 rounded-md'>
                  <option>Conservative</option>
                  <option>Normal</option>
                  <option>Aggressive</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Contest Type
                </label>
                <select className='w-full px-3 py-2 border border-gray-300 rounded-md'>
                  <option>GPP</option>
                  <option>Cash Game</option>
                  <option>Tournament</option>
                </select>
              </div>

              <Button className='w-full bg-blue-600 hover:bg-blue-700'>
                Run Simulation
              </Button>
            </div>
          </Card>

          {/* Results Summary */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Simulation Results</h2>

            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Win Rate:</span>
                <span className='font-semibold'>12.4%</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>Cash Rate:</span>
                <span className='font-semibold'>24.7%</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>Avg Score:</span>
                <span className='font-semibold'>142.3</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>ROI:</span>
                <span className='font-semibold text-green-600'>+15.2%</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>Sharpe Ratio:</span>
                <span className='font-semibold'>1.24</span>
              </div>
            </div>
          </Card>

          {/* Lineup Distribution */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Top Performing Lineups</h2>

            <div className='space-y-3'>
              {[1, 2, 3, 4, 5].map(rank => (
                <div
                  key={rank}
                  className='flex justify-between items-center p-3 bg-gray-50 rounded'
                >
                  <span className='font-medium'>Lineup #{rank}</span>
                  <div className='text-right'>
                    <div className='font-semibold'>156.7 pts</div>
                    <div className='text-sm text-gray-600'>Win: 18.2%</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className='mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card className='p-6'>
            <h3 className='text-xl font-semibold mb-4'>Score Distribution</h3>
            <div className='h-64 bg-gray-100 rounded flex items-center justify-center'>
              <span className='text-gray-500'>Chart: Score Distribution Histogram</span>
            </div>
          </Card>

          <Card className='p-6'>
            <h3 className='text-xl font-semibold mb-4'>ROI by Iteration</h3>
            <div className='h-64 bg-gray-100 rounded flex items-center justify-center'>
              <span className='text-gray-500'>Chart: ROI Convergence</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
