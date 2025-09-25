import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { PlayerWithProjection } from '@shared/schema';

interface ProjectionsTabProps {
  selectedSport: 'nfl' | 'nba';
  selectedSite: 'dk' | 'fd';
  activeSlateId: string | null;
}

export default function ProjectionsTab({
  selectedSport,
  selectedSite,
  activeSlateId,
}: ProjectionsTabProps) {
  const [positionFilter, setPositionFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [playerSearch, setPlayerSearch] = useState('');
  const { toast } = useToast();

  const {
    data: players = [],
    isLoading,
    refetch,
  } = useQuery<PlayerWithProjection[]>({
    queryKey: ['/api/players', activeSlateId, positionFilter, teamFilter, playerSearch],
    queryFn: async () => {
      if (!activeSlateId) return [];

      const params = new URLSearchParams({
        slateId: activeSlateId,
        position: positionFilter,
        team: teamFilter,
        search: playerSearch,
      });

      const response = await fetch(`/api/players?${params}`);
      if (!response.ok) {
        throw new Error(`Error fetching players: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!activeSlateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefreshProjections = async () => {
    if (!activeSlateId) {
      toast({
        title: 'No Active Slate',
        description: 'Please upload a salary CSV first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiRequest('POST', '/api/projections/generate', { slateId: activeSlateId });
      await refetch();
      toast({
        title: 'Projections Generated',
        description: 'AI-powered projections have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'There was an error generating projections.',
        variant: 'destructive',
      });
    }
  };

  const handleExportProjections = async () => {
    // Implementation for exporting projections CSV
    toast({
      title: 'Export Started',
      description: 'Projections CSV export is being prepared.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className='bg-primary/10 text-primary'>Active</Badge>;
      case 'questionable':
        return <Badge className='bg-accent/10 text-accent'>Questionable</Badge>;
      case 'doubtful':
        return <Badge className='bg-destructive/10 text-destructive'>Doubtful</Badge>;
      case 'out':
        return <Badge className='bg-destructive/10 text-destructive'>Out</Badge>;
      default:
        return <Badge className='bg-primary/10 text-primary'>Active</Badge>;
    }
  };

  const getPositions = (sport: 'nfl' | 'nba') => {
    if (sport === 'nfl') {
      return ['all', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    }
    return ['all', 'PG', 'SG', 'SF', 'PF', 'C'];
  };

  if (!activeSlateId) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground'>
          Please upload a salary CSV to view player projections.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Controls Row */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium'>Position:</label>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className='w-32' data-testid='select-position-filter'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getPositions(selectedSport).map(pos => (
                  <SelectItem key={pos} value={pos}>
                    {pos === 'all' ? 'All Positions' : pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium'>Team:</label>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className='w-32' data-testid='select-team-filter'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Teams</SelectItem>
                <SelectItem value='BUF'>BUF</SelectItem>
                <SelectItem value='MIA'>MIA</SelectItem>
                <SelectItem value='NE'>NE</SelectItem>
                <SelectItem value='NYJ'>NYJ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder='Search players...'
            value={playerSearch}
            onChange={e => setPlayerSearch(e.target.value)}
            className='w-48'
            data-testid='input-player-search'
          />
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='secondary'
            size='sm'
            onClick={handleExportProjections}
            data-testid='button-export-projections'
          >
            <Download className='w-4 h-4 mr-2' />
            Export CSV
          </Button>
          <Button
            size='sm'
            onClick={handleRefreshProjections}
            disabled={isLoading}
            data-testid='button-refresh-projections'
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Projections Table */}
      <div className='border border-border rounded-lg overflow-hidden'>
        <div className='overflow-x-auto custom-scrollbar max-h-96'>
          <table className='w-full data-table'>
            <thead className='bg-muted/50 sticky top-0'>
              <tr className='border-b border-border'>
                <th className='text-left py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Player
                </th>
                <th className='text-left py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Pos
                </th>
                <th className='text-left py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Team
                </th>
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Salary
                </th>
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Proj
                </th>
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Floor
                </th>
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Ceil
                </th>
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Own%
                </th>
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Value
                </th>
                <th className='text-center py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className='border-b border-border animate-pulse'>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-32'></div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-8'></div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-12'></div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-16'></div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-12'></div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-12'></div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-12'></div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-12'></div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-12'></div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='h-4 bg-muted rounded w-16'></div>
                    </td>
                  </tr>
                ))
              ) : players && players.length > 0 ? (
                players.map((player: PlayerWithProjection) => (
                  <tr
                    key={player.id}
                    className='border-b border-border hover:bg-muted/30 transition-colors'
                    data-testid={`row-player-${player.id}`}
                  >
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-muted rounded-full flex items-center justify-center'>
                          <span className='text-xs font-medium'>
                            {player.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className='font-medium text-sm'>{player.name}</div>
                          <div className='text-xs text-muted-foreground'>
                            {player.opponent ? `vs ${player.opponent}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='py-3 px-4 text-sm'>{player.position}</td>
                    <td className='py-3 px-4 text-sm'>{player.team}</td>
                    <td className='py-3 px-4 text-right text-sm'>
                      ${player.salary?.toLocaleString()}
                    </td>
                    <td className='py-3 px-4 text-right text-sm font-medium'>
                      {player.projection?.toFixed(1)}
                    </td>
                    <td className='py-3 px-4 text-right text-sm text-muted-foreground'>
                      {player.floor?.toFixed(1)}
                    </td>
                    <td className='py-3 px-4 text-right text-sm text-muted-foreground'>
                      {player.ceiling?.toFixed(1)}
                    </td>
                    <td className='py-3 px-4 text-right text-sm'>
                      {((player.ownership || 0) * 100).toFixed(1)}%
                    </td>
                    <td className='py-3 px-4 text-right text-sm text-primary'>
                      {player.value?.toFixed(2)}
                    </td>
                    <td className='py-3 px-4 text-center'>
                      {getStatusBadge(player.status || 'active')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className='py-8 text-center text-muted-foreground'>
                    {activeSlateId
                      ? 'No projections available. Click "Refresh" to generate projections.'
                      : 'Please upload a salary CSV to view projections.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
