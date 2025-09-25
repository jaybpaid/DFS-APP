import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { LineupWithPlayers } from '@shared/schema';

interface LineupsTabProps {
  selectedSport: 'nfl' | 'nba';
  selectedSite: 'dk' | 'fd';
  activeSlateId: string | null;
}

export default function LineupsTab({
  selectedSport,
  selectedSite,
  activeSlateId,
}: LineupsTabProps) {
  const [sortBy, setSortBy] = useState('ev');
  const [riskFilter, setRiskFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLineups, setSelectedLineups] = useState<Set<string>>(new Set());
  const lineupsPerPage = 50;

  const { data: lineups = [], isLoading } = useQuery<LineupWithPlayers[]>({
    queryKey: ['/api/lineups', activeSlateId, sortBy, riskFilter],
    enabled: !!activeSlateId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLineups(new Set(lineups?.map((l: LineupWithPlayers) => l.id) || []));
    } else {
      setSelectedLineups(new Set());
    }
  };

  const handleSelectLineup = (lineupId: string, checked: boolean) => {
    const newSelected = new Set(selectedLineups);
    if (checked) {
      newSelected.add(lineupId);
    } else {
      newSelected.delete(lineupId);
    }
    setSelectedLineups(newSelected);
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className='bg-primary/10 text-primary text-xs'>Low</Badge>;
      case 'medium':
        return <Badge className='bg-accent/10 text-accent text-xs'>Med</Badge>;
      case 'high':
        return (
          <Badge className='bg-destructive/10 text-destructive text-xs'>High</Badge>
        );
      default:
        return (
          <Badge className='bg-muted/10 text-muted-foreground text-xs'>Unknown</Badge>
        );
    }
  };

  const getPositionHeaders = (sport: 'nfl' | 'nba', site: 'dk' | 'fd') => {
    if (sport === 'nfl') {
      if (site === 'dk') {
        return ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'K', 'DST'];
      } else {
        return ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'K', 'D'];
      }
    } else {
      if (site === 'dk') {
        return ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL'];
      } else {
        return ['PG1', 'PG2', 'SG1', 'SG2', 'SF1', 'SF2', 'PF1', 'PF2', 'C'];
      }
    }
  };

  const formatPlayerName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}.${parts[parts.length - 1]}`;
    }
    return name.slice(0, 8);
  };

  const paginatedLineups = lineups
    ? lineups.slice((currentPage - 1) * lineupsPerPage, currentPage * lineupsPerPage)
    : [];

  const totalPages = lineups ? Math.ceil(lineups.length / lineupsPerPage) : 0;

  if (!activeSlateId) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground'>
          Please upload a salary CSV and generate lineups to view them here.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Lineup Controls */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium'>Sort by:</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className='w-40' data-testid='select-lineup-sort'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ev'>Expected Value</SelectItem>
                <SelectItem value='projection'>Projection</SelectItem>
                <SelectItem value='ownership'>Ownership</SelectItem>
                <SelectItem value='risk'>Risk Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium'>Risk:</label>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className='w-40' data-testid='select-risk-filter'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Risk Levels</SelectItem>
                <SelectItem value='low'>Low Risk</SelectItem>
                <SelectItem value='medium'>Medium Risk</SelectItem>
                <SelectItem value='high'>High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>
            Showing{' '}
            {Math.min((currentPage - 1) * lineupsPerPage + 1, lineups?.length || 0)}-
            {Math.min(currentPage * lineupsPerPage, lineups?.length || 0)} of{' '}
            {lineups?.length || 0}
          </span>
          <Button
            variant='secondary'
            size='sm'
            disabled={selectedLineups.size === 0}
            data-testid='button-export-selected-lineups'
          >
            <Download className='w-4 h-4 mr-2' />
            Export Selected
          </Button>
        </div>
      </div>

      {/* Lineup Table */}
      <div className='border border-border rounded-lg overflow-hidden'>
        <div className='overflow-x-auto custom-scrollbar max-h-96'>
          <table className='w-full data-table'>
            <thead className='bg-muted/50 sticky top-0'>
              <tr className='border-b border-border'>
                <th className='text-left py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  <Checkbox
                    checked={
                      selectedLineups.size > 0 &&
                      selectedLineups.size === lineups?.length
                    }
                    onCheckedChange={handleSelectAll}
                    data-testid='checkbox-select-all-lineups'
                  />
                </th>
                <th className='text-left py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  #
                </th>
                {getPositionHeaders(selectedSport, selectedSite).map((pos, index) => (
                  <th
                    key={index}
                    className='text-left py-3 px-4 font-medium text-xs uppercase tracking-wide'
                  >
                    {pos}
                  </th>
                ))}
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Salary
                </th>
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Proj
                </th>
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  EV
                </th>
                <th className='text-right py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Own%
                </th>
                <th className='text-center py-3 px-4 font-medium text-xs uppercase tracking-wide'>
                  Risk
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className='border-b border-border animate-pulse'>
                    {[
                      ...Array(
                        getPositionHeaders(selectedSport, selectedSite).length + 6
                      ),
                    ].map((_, j) => (
                      <td key={j} className='py-2 px-4'>
                        <div className='h-4 bg-muted rounded'></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedLineups.length > 0 ? (
                paginatedLineups.map((lineup: LineupWithPlayers, index: number) => (
                  <tr
                    key={lineup.id}
                    className='border-b border-border hover:bg-muted/30 transition-colors'
                    data-testid={`row-lineup-${lineup.id}`}
                  >
                    <td className='py-2 px-4'>
                      <Checkbox
                        checked={selectedLineups.has(lineup.id)}
                        onCheckedChange={checked =>
                          handleSelectLineup(lineup.id, checked as boolean)
                        }
                      />
                    </td>
                    <td className='py-2 px-4 text-sm font-medium'>
                      {(currentPage - 1) * lineupsPerPage + index + 1}
                    </td>

                    {/* Player positions */}
                    {getPositionHeaders(selectedSport, selectedSite).map(
                      (_, posIndex) => (
                        <td key={posIndex} className='py-2 px-4 text-xs'>
                          {lineup.playerDetails[posIndex]
                            ? formatPlayerName(lineup.playerDetails[posIndex].name)
                            : ''}
                        </td>
                      )
                    )}

                    <td className='py-2 px-4 text-right text-sm'>
                      ${lineup.totalSalary.toLocaleString()}
                    </td>
                    <td className='py-2 px-4 text-right text-sm font-medium'>
                      {lineup.totalProjection.toFixed(1)}
                    </td>
                    <td className='py-2 px-4 text-right text-sm text-primary font-medium'>
                      {lineup.expectedValue.toFixed(1)}
                    </td>
                    <td className='py-2 px-4 text-right text-sm'>
                      {(lineup.totalOwnership * 100).toFixed(1)}%
                    </td>
                    <td className='py-2 px-4 text-center'>
                      {getRiskBadge(lineup.riskLevel)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={getPositionHeaders(selectedSport, selectedSite).length + 6}
                    className='py-8 text-center text-muted-foreground'
                  >
                    No lineups generated yet. Use the Optimizer tab to create lineups.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              data-testid='button-previous-page'
            >
              Previous
            </Button>

            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setCurrentPage(pageNum)}
                  data-testid={`button-page-${pageNum}`}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              data-testid='button-next-page'
            >
              Next
            </Button>
          </div>

          <div className='text-sm text-muted-foreground'>
            Page {currentPage} of {totalPages} ({lineups?.length || 0} lineups)
          </div>
        </div>
      )}
    </div>
  );
}
