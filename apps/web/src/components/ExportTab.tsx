import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { LateSwapStatus, BreakingNews } from '@shared/schema';

interface ExportTabProps {
  selectedSport: 'nfl' | 'nba';
  selectedSite: 'dk' | 'fd';
  activeSlateId: string | null;
}

export default function ExportTab({
  selectedSport,
  selectedSite,
  activeSlateId,
}: ExportTabProps) {
  const [exportSettings, setExportSettings] = useState({
    format: 'draftkings',
    rangeStart: 1,
    rangeEnd: 150,
    includeProjections: true,
    includeOwnership: true,
    includeMetadata: false,
  });
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success'>(
    'idle'
  );
  const { toast } = useToast();

  const { data: swapStatus } = useQuery<LateSwapStatus>({
    queryKey: ['/api/late-swap/status', activeSlateId],
    enabled: !!activeSlateId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: breakingNews = [] } = useQuery<BreakingNews[]>({
    queryKey: ['/api/late-swap/news', activeSlateId],
    enabled: !!activeSlateId,
    refetchInterval: 60000, // Refresh every minute
  });

  const handleExportLineups = async () => {
    if (!activeSlateId) {
      toast({
        title: 'No Active Slate',
        description: 'Please upload a salary CSV first.',
        variant: 'destructive',
      });
      return;
    }

    setExportStatus('exporting');

    try {
      const response = await apiRequest('POST', '/api/export', {
        slateId: activeSlateId,
        ...exportSettings,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lineups_${selectedSite}_${selectedSport}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportStatus('success');
        toast({
          title: 'Export Complete',
          description: 'Lineups have been exported successfully.',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('idle');
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting lineups.',
        variant: 'destructive',
      });
    }
  };

  const handleRefreshLateNews = async () => {
    if (!activeSlateId) return;

    try {
      await apiRequest('POST', '/api/late-swap/refresh', { slateId: activeSlateId });
      toast({
        title: 'News Refreshed',
        description: 'Breaking news and player updates have been refreshed.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh breaking news.',
        variant: 'destructive',
      });
    }
  };

  const handleReoptimizeUnlocked = async () => {
    if (!activeSlateId) return;

    try {
      const response = await apiRequest('POST', '/api/late-swap/reoptimize', {
        slateId: activeSlateId,
        lockedPlayers: [], // Would get this from locked player selections
      });

      const result = await response.json();
      toast({
        title: 'Re-optimization Complete',
        description: `Updated ${result.lineupsUpdated} lineups with unlocked players.`,
      });
    } catch (error) {
      toast({
        title: 'Re-optimization Failed',
        description: 'Failed to re-optimize lineups.',
        variant: 'destructive',
      });
    }
  };

  const getNewsIcon = (type: string) => {
    switch (type) {
      case 'injury':
        return '🏥';
      case 'weather':
        return '🌦️';
      case 'odds':
        return '📊';
      default:
        return '📰';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-accent';
      case 'low':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!activeSlateId) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground'>
          Please upload a salary CSV to access export and late swap features.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Export Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <Card>
          <CardContent className='p-6 space-y-6'>
            <h3 className='text-lg font-semibold'>Export Lineups</h3>

            {/* Export Settings */}
            <div className='space-y-4'>
              <div>
                <Label htmlFor='exportFormat' className='text-sm font-medium'>
                  Export Format
                </Label>
                <Select
                  value={exportSettings.format}
                  onValueChange={value =>
                    setExportSettings(prev => ({
                      ...prev,
                      format: value,
                    }))
                  }
                >
                  <SelectTrigger className='mt-1' data-testid='select-export-format'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='draftkings'>DraftKings CSV</SelectItem>
                    <SelectItem value='fanduel'>FanDuel CSV</SelectItem>
                    <SelectItem value='both'>Both Formats</SelectItem>
                    <SelectItem value='analysis'>Analysis CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className='text-sm font-medium'>Lineup Range</Label>
                <div className='flex items-center gap-2 mt-1'>
                  <Input
                    type='number'
                    value={exportSettings.rangeStart}
                    onChange={e =>
                      setExportSettings(prev => ({
                        ...prev,
                        rangeStart: parseInt(e.target.value) || 1,
                      }))
                    }
                    min='1'
                    placeholder='From'
                    className='flex-1'
                    data-testid='input-export-range-start'
                  />
                  <span className='text-muted-foreground'>to</span>
                  <Input
                    type='number'
                    value={exportSettings.rangeEnd}
                    onChange={e =>
                      setExportSettings(prev => ({
                        ...prev,
                        rangeEnd: parseInt(e.target.value) || 150,
                      }))
                    }
                    min='1'
                    placeholder='To'
                    className='flex-1'
                    data-testid='input-export-range-end'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-3'>
                  <Checkbox
                    id='includeProjections'
                    checked={exportSettings.includeProjections}
                    onCheckedChange={checked =>
                      setExportSettings(prev => ({
                        ...prev,
                        includeProjections: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor='includeProjections' className='text-sm'>
                    Include projections
                  </Label>
                </div>
                <div className='flex items-center gap-3'>
                  <Checkbox
                    id='includeOwnership'
                    checked={exportSettings.includeOwnership}
                    onCheckedChange={checked =>
                      setExportSettings(prev => ({
                        ...prev,
                        includeOwnership: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor='includeOwnership' className='text-sm'>
                    Include ownership
                  </Label>
                </div>
                <div className='flex items-center gap-3'>
                  <Checkbox
                    id='includeMetadata'
                    checked={exportSettings.includeMetadata}
                    onCheckedChange={checked =>
                      setExportSettings(prev => ({
                        ...prev,
                        includeMetadata: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor='includeMetadata' className='text-sm'>
                    Include metadata
                  </Label>
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className='space-y-3'>
              <Button
                onClick={handleExportLineups}
                disabled={exportStatus === 'exporting'}
                className='w-full bg-primary text-primary-foreground hover:bg-primary/90'
                data-testid='button-export-lineups'
              >
                {exportStatus === 'exporting' ? (
                  <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                ) : (
                  <Download className='w-4 h-4 mr-2' />
                )}
                Export Selected Lineups
              </Button>

              {/* Export Status */}
              {exportStatus === 'success' && (
                <div className='bg-primary/10 border border-primary/20 rounded-md p-3'>
                  <div className='flex items-center gap-2'>
                    <span className='status-dot status-success'></span>
                    <span className='text-sm font-medium'>Export Complete</span>
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    lineups_{selectedSite}_{new Date().toISOString().slice(0, 10)}.csv
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Late Swap Section */}
        <Card>
          <CardContent className='p-6 space-y-6'>
            <h3 className='text-lg font-semibold'>Late Swap Manager</h3>

            {/* Game Status */}
            <div className='space-y-3'>
              <h4 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
                Game Status
              </h4>
              <div className='space-y-2'>
                <div className='flex items-center justify-between p-3 bg-muted/20 rounded-lg'>
                  <div>
                    <div className='font-medium text-sm'>BUF @ MIA</div>
                    <div className='text-xs text-muted-foreground'>
                      Sunday 1:00 PM ET
                    </div>
                  </div>
                  <Badge className='bg-primary/10 text-primary'>Active</Badge>
                </div>

                <div className='flex items-center justify-between p-3 bg-muted/20 rounded-lg'>
                  <div>
                    <div className='font-medium text-sm'>KC @ LAC</div>
                    <div className='text-xs text-muted-foreground'>
                      Sunday 4:25 PM ET
                    </div>
                  </div>
                  <Badge className='bg-accent/10 text-accent'>Pending</Badge>
                </div>
              </div>
            </div>

            {/* Player Lock Status */}
            <div className='space-y-3'>
              <h4 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
                Player Lock Status
              </h4>
              <div className='bg-muted/20 rounded-lg p-3 max-h-48 overflow-y-auto custom-scrollbar'>
                <div className='space-y-2 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span>Josh Allen (QB)</span>
                    <span className='text-destructive'>🔒 Locked</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Stefon Diggs (WR)</span>
                    <span className='text-destructive'>🔒 Locked</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Tyreek Hill (WR)</span>
                    <span className='text-primary'>🔓 Swappable</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Travis Kelce (TE)</span>
                    <span className='text-primary'>🔓 Swappable</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Late Swap Actions */}
            <div className='space-y-3'>
              <Button
                onClick={handleRefreshLateNews}
                className='w-full bg-accent text-accent-foreground hover:bg-accent/90'
                data-testid='button-refresh-late-news'
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                Refresh Late News
              </Button>

              <Button
                onClick={handleReoptimizeUnlocked}
                variant='secondary'
                className='w-full'
                data-testid='button-reoptimize-unlocked'
              >
                <Zap className='w-4 h-4 mr-2' />
                Re-optimize Unlocked Players
              </Button>

              {/* Late Swap Status */}
              {swapStatus && (
                <div className='bg-accent/10 border border-accent/20 rounded-md p-3'>
                  <div className='flex items-center gap-2'>
                    <span className='status-dot status-warning'></span>
                    <span className='text-sm font-medium'>Late Swap Available</span>
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {swapStatus.lineupsAffected} lineups can be updated
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent News/Updates */}
      <Card>
        <CardContent className='p-6 space-y-3'>
          <h4 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
            Breaking News & Updates
          </h4>
          <div className='bg-muted/20 rounded-lg p-4 space-y-3'>
            {breakingNews && breakingNews.length > 0 ? (
              breakingNews.map((news: BreakingNews) => (
                <div key={news.id} className='flex items-start gap-3'>
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      news.impact === 'high'
                        ? 'bg-destructive'
                        : news.impact === 'medium'
                          ? 'bg-accent'
                          : 'bg-primary'
                    }`}
                  ></div>
                  <div>
                    <p className='text-sm font-medium'>
                      {getNewsIcon(news.type)} {news.player ? `${news.player} - ` : ''}
                      {news.message}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(news.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0'></div>
                  <div>
                    <p className='text-sm font-medium'>Ja'Marr Chase - QUESTIONABLE</p>
                    <p className='text-xs text-muted-foreground'>
                      Hip injury, game-time decision. Monitor warmups.
                    </p>
                    <p className='text-xs text-muted-foreground'>2 minutes ago</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0'></div>
                  <div>
                    <p className='text-sm font-medium'>Weather Update - BUF</p>
                    <p className='text-xs text-muted-foreground'>
                      Wind speeds increased to 15-20 MPH, passing game impact likely.
                    </p>
                    <p className='text-xs text-muted-foreground'>5 minutes ago</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0'></div>
                  <div>
                    <p className='text-sm font-medium'>Line Movement - KC vs LAC</p>
                    <p className='text-xs text-muted-foreground'>
                      Total moved from 52.5 to 54.5, increased passing volume expected.
                    </p>
                    <p className='text-xs text-muted-foreground'>8 minutes ago</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
