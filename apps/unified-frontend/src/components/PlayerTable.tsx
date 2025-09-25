import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DFSPlayer } from '@/providers/DFSIntegrationProvider';
import { Search, SortAsc, SortDesc, DollarSign, TrendingUp, Users } from 'lucide-react';

interface PlayerTableProps {
  players: DFSPlayer[];
}

export function PlayerTable({ players }: PlayerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'salary' | 'projection' | 'ownership'>(
    'projection'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredPlayers = players
    .filter(player => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition =
        positionFilter === 'all' || player.position === positionFilter;
      return matchesSearch && matchesPosition;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle undefined values
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const positions = Array.from(new Set(players.map(p => p.position))).sort();

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

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Search players or teams...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10 bg-gray-800 border-gray-700'
          />
        </div>

        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className='w-32 bg-gray-800 border-gray-700'>
            <SelectValue placeholder='Position' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Positions</SelectItem>
            {positions.map(pos => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className='rounded-lg border border-gray-800 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-800'>
              <tr>
                <th className='text-left p-4 font-medium text-gray-300'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleSort('name')}
                    className='flex items-center gap-1 hover:text-white'
                  >
                    Player
                    {sortBy === 'name' &&
                      (sortOrder === 'asc' ? (
                        <SortAsc className='w-4 h-4' />
                      ) : (
                        <SortDesc className='w-4 h-4' />
                      ))}
                  </Button>
                </th>
                <th className='text-left p-4 font-medium text-gray-300'>Position</th>
                <th className='text-left p-4 font-medium text-gray-300'>Team</th>
                <th className='text-right p-4 font-medium text-gray-300'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleSort('salary')}
                    className='flex items-center gap-1 hover:text-white ml-auto'
                  >
                    <DollarSign className='w-4 h-4' />
                    Salary
                    {sortBy === 'salary' &&
                      (sortOrder === 'asc' ? (
                        <SortAsc className='w-4 h-4' />
                      ) : (
                        <SortDesc className='w-4 h-4' />
                      ))}
                  </Button>
                </th>
                <th className='text-right p-4 font-medium text-gray-300'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleSort('projection')}
                    className='flex items-center gap-1 hover:text-white ml-auto'
                  >
                    <TrendingUp className='w-4 h-4' />
                    Projection
                    {sortBy === 'projection' &&
                      (sortOrder === 'asc' ? (
                        <SortAsc className='w-4 h-4' />
                      ) : (
                        <SortDesc className='w-4 h-4' />
                      ))}
                  </Button>
                </th>
                <th className='text-right p-4 font-medium text-gray-300'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleSort('ownership')}
                    className='flex items-center gap-1 hover:text-white ml-auto'
                  >
                    <Users className='w-4 h-4' />
                    Ownership
                    {sortBy === 'ownership' &&
                      (sortOrder === 'asc' ? (
                        <SortAsc className='w-4 h-4' />
                      ) : (
                        <SortDesc className='w-4 h-4' />
                      ))}
                  </Button>
                </th>
                <th className='text-right p-4 font-medium text-gray-300'>Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr
                  key={player.id}
                  className={`border-t border-gray-800 hover:bg-gray-800 ${
                    index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'
                  }`}
                >
                  <td className='p-4'>
                    <div className='flex flex-col'>
                      <span className='font-medium text-white'>{player.name}</span>
                      {player.opponent && (
                        <span className='text-sm text-gray-400'>
                          vs {player.opponent}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className='p-4'>
                    <Badge
                      className={`${getPositionColor(player.position)} text-white`}
                    >
                      {player.position}
                    </Badge>
                  </td>
                  <td className='p-4 text-gray-300'>{player.team}</td>
                  <td className='p-4 text-right text-white font-mono'>
                    ${player.salary.toLocaleString()}
                  </td>
                  <td className='p-4 text-right text-white font-bold'>
                    {player.projection.toFixed(1)}
                  </td>
                  <td className='p-4 text-right text-gray-300'>
                    {player.ownership ? `${player.ownership.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className='p-4 text-right'>
                    <span className='text-green-400 font-medium'>
                      {((player.projection / player.salary) * 1000).toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPlayers.length === 0 && (
        <div className='text-center py-8 text-gray-400'>
          <Users className='w-12 h-12 mx-auto mb-4 opacity-50' />
          <p>No players found matching your criteria</p>
        </div>
      )}

      <div className='text-sm text-gray-400'>
        Showing {filteredPlayers.length} of {players.length} players
      </div>
    </div>
  );
}
