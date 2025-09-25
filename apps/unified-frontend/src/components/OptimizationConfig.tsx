import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { OptimizationConfig as OptimizationConfigType } from '@/providers/DFSIntegrationProvider';
import { Settings } from 'lucide-react';

interface OptimizationConfigProps {
  config: OptimizationConfigType;
  updateConfig: (config: Partial<OptimizationConfigType>) => void;
}

export function OptimizationConfig({ config, updateConfig }: OptimizationConfigProps) {
  return (
    <Card className='bg-gray-900 border-gray-800'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Settings className='w-5 h-5 text-blue-400' />
          Optimization Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Lineup Count */}
        <div className='space-y-2'>
          <Label htmlFor='lineup-count' className='text-sm font-medium text-gray-300'>
            Lineup Count: {config.lineupCount}
          </Label>
          <Slider
            id='lineup-count'
            min={1}
            max={100}
            step={1}
            value={[config.lineupCount]}
            onValueChange={value => updateConfig({ lineupCount: value[0] })}
            className='w-full'
          />
          <div className='flex justify-between text-xs text-gray-500'>
            <span>1</span>
            <span>100</span>
          </div>
        </div>

        {/* Optimization Objective */}
        <div className='space-y-2'>
          <Label htmlFor='objective' className='text-sm font-medium text-gray-300'>
            Optimization Objective
          </Label>
          <Select
            value={config.objective}
            onValueChange={(value: 'ev' | 'projection' | 'hybrid' | 'ceiling') =>
              updateConfig({ objective: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='Select objective' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='projection'>Max Projection</SelectItem>
              <SelectItem value='ev'>Expected Value</SelectItem>
              <SelectItem value='hybrid'>Hybrid Approach</SelectItem>
              <SelectItem value='ceiling'>Ceiling Plays</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Simulation Runs */}
        <div className='space-y-2'>
          <Label
            htmlFor='simulation-runs'
            className='text-sm font-medium text-gray-300'
          >
            Simulation Runs: {config.simulationRuns?.toLocaleString()}
          </Label>
          <Select
            value={config.simulationRuns?.toString()}
            onValueChange={value => updateConfig({ simulationRuns: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select simulation runs' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1000'>1,000</SelectItem>
              <SelectItem value='10000'>10,000</SelectItem>
              <SelectItem value='50000'>50,000</SelectItem>
              <SelectItem value='100000'>100,000</SelectItem>
              <SelectItem value='250000'>250,000</SelectItem>
              <SelectItem value='500000'>500,000</SelectItem>
              <SelectItem value='1000000'>1,000,000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stacking */}
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='stacking' className='text-sm font-medium text-gray-300'>
              Enable Stacking
            </Label>
            <p className='text-xs text-gray-500'>
              Include QB + WR/TE stacks from same team
            </p>
          </div>
          <Switch
            id='stacking'
            checked={config.stackingEnabled}
            onCheckedChange={checked => updateConfig({ stackingEnabled: checked })}
          />
        </div>

        {/* Exposure Settings */}
        <div className='space-y-4'>
          <Label className='text-sm font-medium text-gray-300'>Exposure Settings</Label>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='max-exposure' className='text-xs text-gray-400'>
                Max Exposure: {config.exposureSettings?.maxExposure}%
              </Label>
              <Slider
                id='max-exposure'
                min={0}
                max={100}
                step={5}
                value={[config.exposureSettings?.maxExposure || 25]}
                onValueChange={value =>
                  updateConfig({
                    exposureSettings: {
                      ...config.exposureSettings,
                      maxExposure: value[0],
                    },
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='max-per-team' className='text-xs text-gray-400'>
                Max Per Team: {config.exposureSettings?.maxPerTeam}
              </Label>
              <Slider
                id='max-per-team'
                min={1}
                max={8}
                step={1}
                value={[config.exposureSettings?.maxPerTeam || 4]}
                onValueChange={value =>
                  updateConfig({
                    exposureSettings: {
                      ...config.exposureSettings,
                      maxPerTeam: value[0],
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Player Locks/Bans */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label
              htmlFor='locked-players'
              className='text-sm font-medium text-gray-300'
            >
              Locked Players
            </Label>
            <Input
              id='locked-players'
              placeholder='Player IDs (comma separated)'
              value={config.lockedPlayers?.join(', ') || ''}
              onChange={e =>
                updateConfig({
                  lockedPlayers: e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
                })
              }
              className='bg-gray-800 border-gray-700'
            />
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='banned-players'
              className='text-sm font-medium text-gray-300'
            >
              Banned Players
            </Label>
            <Input
              id='banned-players'
              placeholder='Player IDs (comma separated)'
              value={config.bannedPlayers?.join(', ') || ''}
              onChange={e =>
                updateConfig({
                  bannedPlayers: e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
                })
              }
              className='bg-gray-800 border-gray-700'
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
