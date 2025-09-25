import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  Target,
  TrendingUp,
  AlertTriangle,
  Lock,
  Ban,
  Star,
  Activity,
  Cloud,
  User,
} from 'lucide-react';
import { PlayerWithProjection } from '@shared/schema';
import PlayerControlSliders from './PlayerControlSliders';
import PlayerTierSelector from './PlayerTierSelector';
import PlayerStatusIndicators from './PlayerStatusIndicators';
import PlayerLockBanControls from './PlayerLockBanControls';

interface AdvancedPlayerControlsProps {
  player: PlayerWithProjection;
  onPlayerUpdate: (playerId: string, updates: Partial<PlayerWithProjection>) => void;
  onClose?: () => void;
  className?: string;
}

export default function AdvancedPlayerControls({
  player,
  onPlayerUpdate,
  onClose,
  className = '',
}: AdvancedPlayerControlsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Handle player updates with callback
  const handlePlayerUpdate = useCallback(
    (updates: Partial<PlayerWithProjection>) => {
      onPlayerUpdate(player.id, updates);
    },
    [player.id, onPlayerUpdate]
  );

  // Calculate value rating based on projection and salary
  const getValueRating = () => {
    if (!player.projection || !player.salary) return 'N/A';
    const value = (player.projection / player.salary) * 1000;
    if (value >= 3.5) return 'Elite';
    if (value >= 3.0) return 'Good';
    if (value >= 2.5) return 'Average';
    return 'Poor';
  };

  // Get tier color for styling
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'A':
        return 'bg-green-500';
      case 'B':
        return 'bg-blue-500';
      case 'C':
        return 'bg-yellow-500';
      case 'D':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <Settings className='w-5 h-5 text-primary' />
              <CardTitle className='text-xl'>Advanced Player Controls</CardTitle>
            </div>
            {player.tier && (
              <Badge className={`${getTierColor(player.tier)} text-white`}>
                Tier {player.tier}
              </Badge>
            )}
          </div>
          {onClose && (
            <Button variant='ghost' size='sm' onClick={onClose}>
              ×
            </Button>
          )}
        </div>

        {/* Player Info Header */}
        <div className='flex items-center gap-4 pt-2'>
          <div className='flex items-center gap-2'>
            <User className='w-4 h-4 text-muted-foreground' />
            <span className='font-semibold'>{player.name}</span>
            <Badge variant='outline'>{player.position}</Badge>
            <Badge variant='secondary'>{player.team}</Badge>
          </div>
          <Separator orientation='vertical' className='h-6' />
          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <span>Salary: ${player.salary?.toLocaleString() || 'N/A'}</span>
            <span>Projection: {player.projection?.toFixed(1) || 'N/A'}</span>
            <span>Value: {getValueRating()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='overview' className='flex items-center gap-2'>
              <Activity className='w-4 h-4' />
              Overview
            </TabsTrigger>
            <TabsTrigger value='exposure' className='flex items-center gap-2'>
              <Target className='w-4 h-4' />
              Exposure
            </TabsTrigger>
            <TabsTrigger value='tiers' className='flex items-center gap-2'>
              <Star className='w-4 h-4' />
              Tiers
            </TabsTrigger>
            <TabsTrigger value='status' className='flex items-center gap-2'>
              <AlertTriangle className='w-4 h-4' />
              Status
            </TabsTrigger>
            <TabsTrigger value='controls' className='flex items-center gap-2'>
              <Settings className='w-4 h-4' />
              Lock/Ban
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Custom Projection */}
              <div className='space-y-2'>
                <Label htmlFor='customProjection' className='text-sm font-medium'>
                  Custom Projection
                </Label>
                <Input
                  id='customProjection'
                  type='number'
                  step='0.1'
                  value={player.customProjection || player.projection || ''}
                  onChange={e =>
                    handlePlayerUpdate({
                      customProjection: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder='Override projection...'
                  className='text-right'
                />
              </div>

              {/* Salary Override */}
              <div className='space-y-2'>
                <Label htmlFor='salaryOverride' className='text-sm font-medium'>
                  Salary Override
                </Label>
                <Input
                  id='salaryOverride'
                  type='number'
                  value={player.salaryOverride || player.salary || ''}
                  onChange={e =>
                    handlePlayerUpdate({
                      salaryOverride: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder='Override salary...'
                  className='text-right'
                />
              </div>

              {/* Ownership Fade */}
              <div className='space-y-2'>
                <Label htmlFor='ownershipFade' className='text-sm font-medium'>
                  Ownership Fade (±%)
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='ownershipFade'
                    type='number'
                    value={player.ownershipFade || 0}
                    onChange={e =>
                      handlePlayerUpdate({
                        ownershipFade: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder='0'
                    className='text-right'
                    min='-50'
                    max='50'
                  />
                  <span className='text-sm text-muted-foreground'>%</span>
                </div>
              </div>

              {/* Boom/Bust Variance */}
              <div className='space-y-2'>
                <Label htmlFor='boomBustVariance' className='text-sm font-medium'>
                  Boom/Bust Profile
                </Label>
                <Select
                  value={
                    player.boomBustVariance === 1
                      ? 'boom'
                      : player.boomBustVariance === -1
                        ? 'bust'
                        : 'normal'
                  }
                  onValueChange={value =>
                    handlePlayerUpdate({
                      boomBustVariance:
                        value === 'boom' ? 1 : value === 'bust' ? -1 : 0,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='boom'>💥 Boom - High Ceiling</SelectItem>
                    <SelectItem value='normal'>📊 Normal - Balanced</SelectItem>
                    <SelectItem value='bust'>📉 Bust - High Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stack Role */}
              <div className='space-y-2'>
                <Label htmlFor='stackRole' className='text-sm font-medium'>
                  Stack Role
                </Label>
                <Select
                  value={player.stackRole || 'none'}
                  onValueChange={value =>
                    handlePlayerUpdate({
                      stackRole: value as 'primary' | 'bring-back' | 'none',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='primary'>🎯 Primary Stack</SelectItem>
                    <SelectItem value='bring-back'>🔄 Bring-Back</SelectItem>
                    <SelectItem value='none'>⚪ No Stack Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Leverage Score */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Leverage Score</Label>
                <div className='flex items-center gap-2 p-2 bg-muted/20 rounded'>
                  <TrendingUp className='w-4 h-4 text-primary' />
                  <span className='font-mono text-sm'>
                    {player.leverage?.toFixed(2) || 'N/A'}
                  </span>
                  <Badge variant='outline' className='ml-auto'>
                    {player.leverage && player.leverage > 0.7
                      ? 'High'
                      : player.leverage && player.leverage > 0.4
                        ? 'Medium'
                        : 'Low'}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Exposure Tab */}
          <TabsContent value='exposure'>
            <PlayerControlSliders player={player} onPlayerUpdate={handlePlayerUpdate} />
          </TabsContent>

          {/* Tiers Tab */}
          <TabsContent value='tiers'>
            <PlayerTierSelector player={player} onPlayerUpdate={handlePlayerUpdate} />
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value='status'>
            <PlayerStatusIndicators
              player={player}
              onPlayerUpdate={handlePlayerUpdate}
            />
          </TabsContent>

          {/* Lock/Ban Controls Tab */}
          <TabsContent value='controls'>
            <PlayerLockBanControls
              player={player}
              onPlayerUpdate={handlePlayerUpdate}
            />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className='flex items-center justify-between pt-4 border-t'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Activity className='w-4 h-4' />
            Last updated:{' '}
            {player.lastNewsUpdate
              ? new Date(player.lastNewsUpdate).toLocaleDateString()
              : 'Never'}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                // Reset all advanced controls to defaults
                handlePlayerUpdate({
                  minExposure: undefined,
                  customProjection: undefined,
                  ownershipFade: 0,
                  boomBustVariance: 0,
                  tier: undefined,
                  stackRole: 'none',
                  salaryOverride: undefined,
                });
              }}
            >
              Reset All
            </Button>
            {onClose && <Button onClick={onClose}>Save & Close</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { AdvancedPlayerControls };
