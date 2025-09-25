/**
 * Lineup History Component
 * Displays saved lineups with filtering, sorting, and export capabilities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Download,
  Filter,
  Search,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projected_points: number;
}

interface Lineup {
  id: string;
  slate_id: string;
  players: Player[];
  total_salary: number;
  projected_score: number;
  ownership: number;
  leverage: number;
  stack_info: string;
  uniqueness: number;
  contest_type: string;
  created_at: string;
  exported: boolean;
  export_format?: string;
}

interface LineupHistoryStats {
  total_lineups: number;
  avg_projected_score: number;
  avg_ownership: number;
  avg_leverage: number;
  unique_slates: number;
  contest_breakdown: Array<{ contest_type: string; count: number }>;
  daily_activity: Array<{ date: string; lineups_created: number }>;
}

export const LineupHistory: React.FC = () => {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [filteredLineups, setFilteredLineups] = useState<Lineup[]>([]);
  const [stats, setStats] = useState<LineupHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'created_at' | 'projected_score' | 'ownership' | 'leverage'
  >('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterContestType, setFilterContestType] = useState<string>('all');
  const [selectedLineups, setSelectedLineups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLineupHistory();
  }, []);

  useEffect(() => {
    filterAndSortLineups();
  }, [lineups, searchTerm, sortBy, sortOrder, filterContestType]);

  const loadLineupHistory = async () => {
    try {
      setLoading(true);

      // Load lineups
      const lineupsResponse = await fetch('/api/lineups/history');
      const lineupsData = await lineupsResponse.json();

      // Load stats
      const statsResponse = await fetch('/api/lineups/stats');
      const statsData = await statsResponse.json();

      if (lineupsData.success) {
        setLineups(lineupsData.lineups);
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error loading lineup history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortLineups = () => {
    let filtered = [...lineups];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        lineup =>
          lineup.slate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lineup.players.some(
            player =>
              player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              player.team.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply contest type filter
    if (filterContestType !== 'all') {
      filtered = filtered.filter(lineup => lineup.contest_type === filterContestType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'projected_score':
          aValue = a.projected_score;
          bValue = b.projected_score;
          break;
        case 'ownership':
          aValue = a.ownership;
          bValue = b.ownership;
          break;
        case 'leverage':
          aValue = a.leverage;
          bValue = b.leverage;
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLineups(filtered);
  };

  const handleLineupSelect = (lineupId: string) => {
    const newSelected = new Set(selectedLineups);
    if (newSelected.has(lineupId)) {
      newSelected.delete(lineupId);
    } else {
      newSelected.add(lineupId);
    }
    setSelectedLineups(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLineups.size === filteredLineups.length) {
      setSelectedLineups(new Set());
    } else {
      setSelectedLineups(new Set(filteredLineups.map(l => l.id)));
    }
  };

  const exportSelectedLineups = async (
    format: 'draftkings' | 'fanduel' | 'superdraft'
  ) => {
    if (selectedLineups.size === 0) return;

    try {
      const selectedLineupsData = filteredLineups.filter(l =>
        selectedLineups.has(l.id)
      );

      const response = await fetch('/api/lineups/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineups: selectedLineupsData,
          format: format,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `lineups_${format}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);

        // Update exported status
        setLineups(prev =>
          prev.map(lineup =>
            selectedLineups.has(lineup.id)
              ? { ...lineup, exported: true, export_format: format }
              : lineup
          )
        );
      }
    } catch (error) {
      console.error('Error exporting lineups:', error);
    }
  };

  const getContestTypeColor = (contestType: string) => {
    switch (contestType) {
      case 'gpp':
        return 'bg-blue-100 text-blue-800';
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'tournament':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Overview */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Users className='h-4 w-4 text-blue-600' />
                <div>
                  <p className='text-sm font-medium text-gray-600'>Total Lineups</p>
                  <p className='text-2xl font-bold'>{stats.total_lineups}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <TrendingUp className='h-4 w-4 text-green-600' />
                <div>
                  <p className='text-sm font-medium text-gray-600'>Avg Projected</p>
                  <p className='text-2xl font-bold'>
                    {stats.avg_projected_score.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Star className='h-4 w-4 text-yellow-600' />
                <div>
                  <p className='text-sm font-medium text-gray-600'>Avg Ownership</p>
                  <p className='text-2xl font-bold'>
                    {(stats.avg_ownership * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Calendar className='h-4 w-4 text-purple-600' />
                <div>
                  <p className='text-sm font-medium text-gray-600'>Unique Slates</p>
                  <p className='text-2xl font-bold'>{stats.unique_slates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue='lineups' className='w-full'>
        <TabsList>
          <TabsTrigger value='lineups'>Lineup History</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value='lineups' className='space-y-4'>
          {/* Filters and Controls */}
          <Card>
            <CardContent className='p-4'>
              <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
                <div className='flex flex-col sm:flex-row gap-4 flex-1'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <Input
                      placeholder='Search lineups, players, or teams...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>

                  <Select
                    value={filterContestType}
                    onValueChange={setFilterContestType}
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue placeholder='Contest Type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      <SelectItem value='gpp'>GPP</SelectItem>
                      <SelectItem value='cash'>Cash</SelectItem>
                      <SelectItem value='tournament'>Tournament</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={`${sortBy}_${sortOrder}`}
                    onValueChange={value => {
                      const [field, order] = value.split('_');
                      setSortBy(field as any);
                      setSortOrder(order as any);
                    }}
                  >
                    <SelectTrigger className='w-48'>
                      <SelectValue placeholder='Sort By' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='created_at_desc'>Newest First</SelectItem>
                      <SelectItem value='created_at_asc'>Oldest First</SelectItem>
                      <SelectItem value='projected_score_desc'>
                        Highest Projected
                      </SelectItem>
                      <SelectItem value='projected_score_asc'>
                        Lowest Projected
                      </SelectItem>
                      <SelectItem value='ownership_desc'>Highest Ownership</SelectItem>
                      <SelectItem value='ownership_asc'>Lowest Ownership</SelectItem>
                      <SelectItem value='leverage_desc'>Highest Leverage</SelectItem>
                      <SelectItem value='leverage_asc'>Lowest Leverage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' onClick={handleSelectAll}>
                    {selectedLineups.size === filteredLineups.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>

                  {selectedLineups.size > 0 && (
                    <div className='flex gap-1'>
                      <Button
                        size='sm'
                        onClick={() => exportSelectedLineups('draftkings')}
                        className='bg-orange-600 hover:bg-orange-700'
                      >
                        <Download className='h-4 w-4 mr-1' />
                        DK ({selectedLineups.size})
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => exportSelectedLineups('fanduel')}
                        className='bg-blue-600 hover:bg-blue-700'
                      >
                        <Download className='h-4 w-4 mr-1' />
                        FD ({selectedLineups.size})
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => exportSelectedLineups('superdraft')}
                        className='bg-purple-600 hover:bg-purple-700'
                      >
                        <Download className='h-4 w-4 mr-1' />
                        SD ({selectedLineups.size})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lineup List */}
          <div className='space-y-3'>
            {filteredLineups.map(lineup => (
              <Card key={lineup.id} className='hover:shadow-md transition-shadow'>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start space-x-4 flex-1'>
                      <input
                        type='checkbox'
                        checked={selectedLineups.has(lineup.id)}
                        onChange={() => handleLineupSelect(lineup.id)}
                        className='mt-1'
                      />

                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <h3 className='font-semibold text-lg'>
                            Slate: {lineup.slate_id}
                          </h3>
                          <Badge className={getContestTypeColor(lineup.contest_type)}>
                            {lineup.contest_type.toUpperCase()}
                          </Badge>
                          {lineup.exported && (
                            <Badge
                              variant='outline'
                              className='text-green-600 border-green-600'
                            >
                              Exported ({lineup.export_format?.toUpperCase()})
                            </Badge>
                          )}
                        </div>

                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-3'>
                          <div>
                            <p className='text-sm text-gray-600'>Projected Score</p>
                            <p className='font-semibold'>
                              {lineup.projected_score.toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <p className='text-sm text-gray-600'>Total Salary</p>
                            <p className='font-semibold'>
                              {formatCurrency(lineup.total_salary)}
                            </p>
                          </div>
                          <div>
                            <p className='text-sm text-gray-600'>Ownership</p>
                            <p className='font-semibold'>
                              {(lineup.ownership * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className='text-sm text-gray-600'>Leverage</p>
                            <p className='font-semibold'>
                              {lineup.leverage.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className='flex flex-wrap gap-2 mb-2'>
                          {lineup.players.map(player => (
                            <Badge
                              key={player.id}
                              variant='secondary'
                              className='text-xs'
                            >
                              {player.name} ({player.position}) -{' '}
                              {formatCurrency(player.salary)}
                            </Badge>
                          ))}
                        </div>

                        {lineup.stack_info && (
                          <p className='text-sm text-gray-600 mb-2'>
                            <strong>Stack:</strong> {lineup.stack_info}
                          </p>
                        )}

                        <p className='text-xs text-gray-500'>
                          Created:{' '}
                          {format(new Date(lineup.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLineups.length === 0 && (
            <Card>
              <CardContent className='p-8 text-center'>
                <p className='text-gray-500'>
                  No lineups found matching your criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='analytics' className='space-y-4'>
          {stats && (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Contest Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Contest Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {stats.contest_breakdown.map(item => (
                      <div
                        key={item.contest_type}
                        className='flex justify-between items-center'
                      >
                        <span className='capitalize'>{item.contest_type}</span>
                        <div className='flex items-center gap-2'>
                          <div className='w-24 bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-blue-600 h-2 rounded-full'
                              style={{
                                width: `${(item.count / stats.total_lineups) * 100}%`,
                              }}
                            />
                          </div>
                          <span className='text-sm font-medium'>{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {stats.daily_activity.slice(0, 7).map(day => (
                      <div key={day.date} className='flex justify-between items-center'>
                        <span className='text-sm'>
                          {format(new Date(day.date), 'MMM dd')}
                        </span>
                        <span className='font-medium'>
                          {day.lineups_created} lineups
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LineupHistory;
