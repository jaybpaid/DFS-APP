import { useState } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { OptimizationSettings } from '@shared/schema';

interface OptimizerTabProps {
  selectedSport: 'nfl' | 'nba';
  selectedSite: 'dk' | 'fd';
  activeSlateId: string | null;
}

export default function OptimizerTab({
  selectedSport,
  selectedSite,
  activeSlateId,
}: OptimizerTabProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [settings, setSettings] = useState<OptimizationSettings>({
    site: selectedSite,
    sport: selectedSport,
    slate_id: activeSlateId || '',
    max_salary: 50000,
    min_salary: 0,
    lineupCount: 150,
    exposure_limit: 100,
    stack_size: 3,
    allow_duplicates: false,
    use_correlations: true,
    use_stacking: true,
    use_ownership: true,
    use_late_swap: false,
    objective: 'ev',
    simulationRuns: 25000,
    stackingEnabled: true,
    stackRules: {
      qbPassCatchers: 60,
      bringBack: 25,
      rbDst: 15,
    },
    teamCorrelation: 75,
    maxExposure: 35,
    minExposure: 5,
    maxPerTeam: 4,
    salaryFloor: 49500,
    lockedPlayers: [],
    bannedPlayers: [],
  });

  const { toast } = useToast();

  const handleRunOptimization = async () => {
    if (!activeSlateId) {
      toast({
        title: 'No Active Slate',
        description: 'Please upload a salary CSV first.',
        variant: 'destructive',
      });
      return;
    }

    setOptimizing(true);
    setOptimizationProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOptimizationProgress(prev => Math.min(prev + Math.random() * 10, 95));
      }, 500);

      const { sport, site, ...settingsWithoutDuplicates } = settings;
      const response = await apiRequest('POST', '/api/optimize', {
        slateId: activeSlateId,
        sport: selectedSport,
        site: selectedSite,
        ...settingsWithoutDuplicates,
      });

      clearInterval(progressInterval);
      setOptimizationProgress(100);

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Optimization Complete',
          description: `Generated ${result.lineupsGenerated} optimal lineups successfully.`,
        });
      } else {
        throw new Error('Optimization failed');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: 'Optimization Failed',
        description: 'There was an error generating lineups. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setOptimizing(false);
      setOptimizationProgress(0);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      site: selectedSite,
      sport: selectedSport,
      slate_id: activeSlateId || '',
      max_salary: 50000,
      min_salary: 0,
      lineupCount: 150,
      exposure_limit: 100,
      stack_size: 3,
      allow_duplicates: false,
      use_correlations: true,
      use_stacking: true,
      use_ownership: true,
      use_late_swap: false,
      objective: 'ev',
      simulationRuns: 25000,
      stackingEnabled: true,
      stackRules: {
        qbPassCatchers: 60,
        bringBack: 25,
        rbDst: 15,
      },
      teamCorrelation: 75,
      maxExposure: 35,
      minExposure: 5,
      maxPerTeam: 4,
      salaryFloor: selectedSite === 'dk' ? 49500 : 59500,
      lockedPlayers: [],
      bannedPlayers: [],
    });
  };

  if (!activeSlateId) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground'>
          Please upload a salary CSV to access the lineup optimizer.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Optimizer Configuration */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Basic Settings */}
        <Card>
          <CardContent className='p-4 space-y-4'>
            <h3 className='text-lg font-semibold'>Optimization Settings</h3>

            <div className='space-y-3'>
              <div>
                <Label htmlFor='lineupCount' className='text-sm font-medium'>
                  Number of Lineups
                </Label>
                <Input
                  id='lineupCount'
                  type='number'
                  value={settings.lineupCount}
                  onChange={e =>
                    setSettings((prev: OptimizationSettings) => ({
                      ...prev,
                      lineupCount: parseInt(e.target.value) || 150,
                    }))
                  }
                  min='1'
                  max='1000'
                  className='mt-1'
                  data-testid='input-lineup-count'
                />
              </div>

              <div>
                <Label htmlFor='objective' className='text-sm font-medium'>
                  Objective Function
                </Label>
                <Select
                  value={settings.objective}
                  onValueChange={value =>
                    setSettings((prev: OptimizationSettings) => ({
                      ...prev,
                      objective: value as 'ev' | 'projection' | 'hybrid' | 'ceiling',
                    }))
                  }
                >
                  <SelectTrigger className='mt-1' data-testid='select-objective'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ev'>Expected Value (EV)</SelectItem>
                    <SelectItem value='projection'>Raw Projection</SelectItem>
                    <SelectItem value='hybrid'>Hybrid (EV + Proj)</SelectItem>
                    <SelectItem value='ceiling'>Ceiling Optimizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='simulationRuns' className='text-sm font-medium'>
                  Simulation Runs
                </Label>
                <Select
                  value={settings.simulationRuns.toString()}
                  onValueChange={value =>
                    setSettings((prev: OptimizationSettings) => ({
                      ...prev,
                      simulationRuns: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className='mt-1' data-testid='select-simulation-runs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='10000'>10,000</SelectItem>
                    <SelectItem value='25000'>25,000</SelectItem>
                    <SelectItem value='50000'>50,000</SelectItem>
                    <SelectItem value='100000'>100,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stacking Configuration */}
        <Card>
          <CardContent className='p-4 space-y-4'>
            <h3 className='text-lg font-semibold'>Stacking Rules</h3>

            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <Checkbox
                  id='stackingEnabled'
                  checked={settings.stackingEnabled}
                  onCheckedChange={checked =>
                    setSettings((prev: OptimizationSettings) => ({
                      ...prev,
                      stackingEnabled: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor='stackingEnabled' className='text-sm'>
                  Enable Stacking
                </Label>
              </div>

              {settings.stackingEnabled && (
                <div className='bg-muted/20 rounded-lg p-3 space-y-2'>
                  {selectedSport === 'nfl' && (
                    <>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm'>QB + 2 Pass Catchers</span>
                        <div className='flex items-center gap-2'>
                          <Input
                            type='number'
                            value={settings.stackRules.qbPassCatchers}
                            onChange={e =>
                              setSettings((prev: OptimizationSettings) => ({
                                ...prev,
                                stackRules: {
                                  ...prev.stackRules,
                                  qbPassCatchers: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            min='0'
                            max='100'
                            className='w-16 text-xs'
                          />
                          <span className='text-xs'>%</span>
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-sm'>Bring-back Stack</span>
                        <div className='flex items-center gap-2'>
                          <Input
                            type='number'
                            value={settings.stackRules.bringBack}
                            onChange={e =>
                              setSettings((prev: OptimizationSettings) => ({
                                ...prev,
                                stackRules: {
                                  ...prev.stackRules,
                                  bringBack: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            min='0'
                            max='100'
                            className='w-16 text-xs'
                          />
                          <span className='text-xs'>%</span>
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-sm'>RB + DST Stack</span>
                        <div className='flex items-center gap-2'>
                          <Input
                            type='number'
                            value={settings.stackRules.rbDst}
                            onChange={e =>
                              setSettings((prev: OptimizationSettings) => ({
                                ...prev,
                                stackRules: {
                                  ...prev.stackRules,
                                  rbDst: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            min='0'
                            max='100'
                            className='w-16 text-xs'
                          />
                          <span className='text-xs'>%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <Label className='text-sm font-medium'>
                  Team Correlation: {settings.teamCorrelation}%
                </Label>
                <Slider
                  value={[settings.teamCorrelation]}
                  onValueChange={value =>
                    setSettings((prev: OptimizationSettings) => ({
                      ...prev,
                      teamCorrelation: value[0],
                    }))
                  }
                  max={100}
                  step={5}
                  className='mt-2'
                />
                <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exposure & Constraints */}
        <Card>
          <CardContent className='p-4 space-y-4'>
            <h3 className='text-lg font-semibold'>Exposure & Constraints</h3>

            <div className='space-y-3'>
              <div>
                <Label htmlFor='maxExposure' className='text-sm font-medium'>
                  Max Exposure %
                </Label>
                <Input
                  id='maxExposure'
                  type='number'
                  value={settings.maxExposure}
                  onChange={e =>
                    setSettings((prev: OptimizationSettings) => ({
                      ...prev,
                      maxExposure: parseInt(e.target.value) || 35,
                    }))
                  }
                  min='0'
                  max='100'
                  className='mt-1'
                  data-testid='input-max-exposure'
                />
              </div>

              <div>
                <Label htmlFor='minExposure' className='text-sm font-medium'>
                  Min Exposure %
                </Label>
                <Input
                  id='minExposure'
                  type='number'
                  value={settings.minExposure}
                  onChange={e =>
                    setSettings((prev: OptimizationSettings) => ({
                      ...prev,
                      minExposure: parseInt(e.target.value) || 5,
                    }))
                  }
                  min='0'
                  max='100'
                  className='mt-1'
                  data-testid='input-min-exposure'
                />
              </div>

              <div>
                <Label htmlFor='maxPerTeam' className='text-sm font-medium'>
                  Max Players per Team
                </Label>
                <Input
                  id='maxPerTeam'
                  type='number'
                  value={settings.maxPerTeam}
                  onChange={e =>
                    setSettings((prev: OptimizationSettings) => ({
                      ...prev,
                      maxPerTeam: parseInt(e.target.value) || 4,
                    }))
                  }
                  min='1'
                  max='9'
                  className='mt-1'
                  data-testid='input-max-per-team'
                />
              </div>

              <div>
                <Label htmlFor='salaryFloor' className='text-sm font-medium'>
                  Salary Floor ($)
                </Label>
                <Input
                  id='salaryFloor'
                  type='number'
                  value={settings.salaryFloor}
                  onChange={e =>
                    setSettings((prev: OptimizationSettings) => ({
                      ...prev,
                      salaryFloor: parseInt(e.target.value) || 49500,
                    }))
                  }
                  min='0'
                  max={selectedSite === 'dk' ? 50000 : 60000}
                  className='mt-1'
                  data-testid='input-salary-floor'
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lock/Ban Players */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardContent className='p-4 space-y-3'>
            <h3 className='text-lg font-semibold'>Locked Players</h3>
            <div className='bg-muted/20 rounded-lg p-4 min-h-24'>
              <p className='text-sm text-muted-foreground'>
                Drag players here to lock them in all lineups
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4 space-y-3'>
            <h3 className='text-lg font-semibold'>Banned Players</h3>
            <div className='bg-destructive/10 rounded-lg p-4 min-h-24'>
              <p className='text-sm text-muted-foreground'>
                Drag players here to exclude from all lineups
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className='flex items-center gap-4'>
        <Button
          onClick={handleRunOptimization}
          disabled={optimizing}
          className='bg-primary text-primary-foreground hover:bg-primary/90'
          data-testid='button-run-optimization'
        >
          {optimizing ? (
            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
          ) : (
            <Zap className='w-4 h-4 mr-2' />
          )}
          Generate Lineups
        </Button>

        <Button
          variant='secondary'
          onClick={handleResetSettings}
          data-testid='button-reset-optimizer'
        >
          <RotateCcw className='w-4 h-4 mr-2' />
          Reset Settings
        </Button>

        {/* Progress indicator */}
        {optimizing && (
          <div className='flex items-center gap-3'>
            <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
            <span className='text-sm'>Optimizing lineups...</span>
            <span className='text-sm text-muted-foreground'>
              {optimizationProgress.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
