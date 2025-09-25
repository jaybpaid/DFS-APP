import React from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function ContestsPage() {
  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>Contest Manager</h1>
          <p className='text-gray-600 mt-1'>
            Import contests and manage lineup entries
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Contest Import */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Import DraftKings CSV</h2>

            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='contest-file'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Contest CSV File
                </label>
                <Input id='contest-file' type='file' accept='.csv' className='w-full' />
              </div>

              <Button className='w-full bg-blue-600 hover:bg-blue-700'>
                Import Contests
              </Button>

              <div className='text-sm text-gray-600'>
                <p>Supported formats:</p>
                <ul className='list-disc list-inside mt-1'>
                  <li>DraftKings Contest CSV</li>
                  <li>FanDuel Contest Export</li>
                  <li>Custom Format</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Active Contests */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Active Contests</h2>

            <div className='space-y-3'>
              {[
                { name: 'Thursday Night Special', entries: 20, fee: 22, prize: 100000 },
                { name: 'Week 3 Millionaire', entries: 5, fee: 22, prize: 1000000 },
                { name: 'TNF Showdown', entries: 150, fee: 3, prize: 10000 },
              ].map((contest, index) => (
                <div key={index} className='p-3 border rounded'>
                  <div className='flex justify-between items-start mb-2'>
                    <h3 className='font-medium'>{contest.name}</h3>
                    <Badge variant='default'>Active</Badge>
                  </div>
                  <div className='text-sm text-gray-600'>
                    <div>Entries: {contest.entries}</div>
                    <div>Entry Fee: ${contest.fee}</div>
                    <div>Prize Pool: ${contest.prize.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Entry Management */}
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Entry Management</h2>

            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Total Entries:</span>
                <span className='font-semibold'>175</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>Total Investment:</span>
                <span className='font-semibold'>$3,890</span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>Expected Return:</span>
                <span className='font-semibold text-green-600'>$4,612</span>
              </div>

              <div className='border-t pt-4'>
                <Button className='w-full bg-green-600 hover:bg-green-700'>
                  Export DraftKings CSV
                </Button>
              </div>

              <Button variant='outline' className='w-full'>
                Generate Entry Report
              </Button>
            </div>
          </Card>
        </div>

        {/* Contest Details Table */}
        <div className='mt-8'>
          <Card className='p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-xl font-semibold'>Contest Entry Details</h3>
              <div className='flex space-x-2'>
                <Button variant='outline' size='sm'>
                  Filter
                </Button>
                <Button variant='outline' size='sm'>
                  Sort
                </Button>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left p-3'>Contest ID</th>
                    <th className='text-left p-3'>Contest Name</th>
                    <th className='text-left p-3'>Entry Fee</th>
                    <th className='text-left p-3'>My Entries</th>
                    <th className='text-left p-3'>Prize Pool</th>
                    <th className='text-left p-3'>Start Time</th>
                    <th className='text-left p-3'>Status</th>
                    <th className='text-left p-3'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: 'DK-123456',
                      name: 'Thursday Night Special',
                      fee: 22,
                      entries: 20,
                      prize: 100000,
                      start: '8:20 PM ET',
                      status: 'Open',
                    },
                    {
                      id: 'DK-789012',
                      name: 'Week 3 Millionaire',
                      fee: 22,
                      entries: 5,
                      prize: 1000000,
                      start: '1:00 PM ET',
                      status: 'Upcoming',
                    },
                    {
                      id: 'DK-345678',
                      name: 'TNF Showdown',
                      fee: 3,
                      entries: 150,
                      prize: 10000,
                      start: '8:20 PM ET',
                      status: 'Open',
                    },
                  ].map((contest, index) => (
                    <tr key={index} className='border-t hover:bg-gray-50'>
                      <td className='p-3 font-mono text-xs'>{contest.id}</td>
                      <td className='p-3 font-medium'>{contest.name}</td>
                      <td className='p-3'>${contest.fee}</td>
                      <td className='p-3'>{contest.entries}</td>
                      <td className='p-3'>${contest.prize.toLocaleString()}</td>
                      <td className='p-3'>{contest.start}</td>
                      <td className='p-3'>
                        <Badge
                          variant={contest.status === 'Open' ? 'default' : 'secondary'}
                        >
                          {contest.status}
                        </Badge>
                      </td>
                      <td className='p-3'>
                        <Button variant='outline' size='sm'>
                          Manage
                        </Button>
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
