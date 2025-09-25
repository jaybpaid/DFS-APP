import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, Target, Shield, Zap } from 'lucide-react';

interface PortfolioSettings {
  maxDupRisk: number;
  minLeverage: number;
  minRoi: number;
  maxOwnership: number;
  minWinProb: number;
  enableFiltering: boolean;
}

interface PortfolioTabProps {
  settings: PortfolioSettings;
  onChange: (settings: PortfolioSettings) => void;
  exclusionStats?: {
    original_lineups: number;
    filtered_lineups: number;
    excluded_lineups: number;
    exclusion_breakdown: Record<string, number>;
  };
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  settings,
  onChange,
  exclusionStats,
}) => {
  const updateSetting = (key: keyof PortfolioSettings, value: number | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatRoi = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatLeverage = (value: number) =>
    `${value > 0 ? '+' : ''}${value.toFixed(1)}`;

  return (
    <div className='space-y-6'>
      {/* Portfolio Filtering Toggle */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5 text-blue-600' />
                Portfolio Filtering
              </CardTitle>
              <CardDescription>
                Apply advanced filters to exclude lineups that don't meet
                portfolio-level thresholds
              </CardDescription>
            </div>
            <Switch
              checked={settings.enableFiltering}
              onCheckedChange={checked => updateSetting('enableFiltering', checked)}
            />
          </div>
        </CardHeader>

        {settings.enableFiltering && (
          <CardContent className='space-y-6'>
            {/* Duplicate Risk Filter */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='flex items-center gap-2'>
                  <Target className='h-4 w-4 text-orange-500' />
                  Max Duplicate Risk
                </Label>
                <Badge variant='outline'>{formatPercentage(settings.maxDupRisk)}</Badge>
              </div>
              <Slider
                value={[settings.maxDupRisk]}
                onValueChange={([value]) => updateSetting('maxDupRisk', value)}
                min={0}
                max={100}
                step={1}
                className='w-full'
              />
              <p className='text-xs text-gray-500'>
                Exclude lineups with duplicate risk above this threshold
              </p>
            </div>

            {/* Minimum Leverage Filter */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='flex items-center gap-2'>
                  <TrendingUp className='h-4 w-4 text-green-500' />
                  Min Leverage Score
                </Label>
                <Badge variant='outline'>{formatLeverage(settings.minLeverage)}</Badge>
              </div>
              <Slider
                value={[settings.minLeverage]}
                onValueChange={([value]) => updateSetting('minLeverage', value)}
                min={-50}
                max={50}
                step={0.5}
                className='w-full'
              />
              <p className='text-xs text-gray-500'>
                Exclude lineups with leverage score below this threshold (positive =
                contrarian)
              </p>
            </div>

            {/* Minimum ROI Filter */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='flex items-center gap-2'>
                  <Zap className='h-4 w-4 text-purple-500' />
                  Min ROI Floor
                </Label>
                <Badge variant='outline'>{formatRoi(settings.minRoi)}</Badge>
              </div>
              <Slider
                value={[settings.minRoi]}
                onValueChange={([value]) => updateSetting('minRoi', value / 100)}
                min={-50}
                max={200}
                step={1}
                className='w-full'
              />
              <p className='text-xs text-gray-500'>
                Exclude lineups with expected ROI below this threshold
              </p>
            </div>

            {/* Maximum Ownership Filter */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='flex items-center gap-2'>
                  <Info className='h-4 w-4 text-blue-500' />
                  Max Projected Ownership
                </Label>
                <Badge variant='outline'>
                  {formatPercentage(settings.maxOwnership)}
                </Badge>
              </div>
              <Slider
                value={[settings.maxOwnership]}
                onValueChange={([value]) => updateSetting('maxOwnership', value)}
                min={50}
                max={500}
                step={5}
                className='w-full'
              />
              <p className='text-xs text-gray-500'>
                Exclude lineups with total projected ownership above this threshold
              </p>
            </div>

            {/* Minimum Win Probability Filter */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='flex items-center gap-2'>
                  <Target className='h-4 w-4 text-green-600' />
                  Min Win Probability
                </Label>
                <Badge variant='outline'>{formatPercentage(settings.minWinProb)}</Badge>
              </div>
              <Slider
                value={[settings.minWinProb]}
                onValueChange={([value]) => updateSetting('minWinProb', value / 100)}
                min={0}
                max={5}
                step={0.1}
                className='w-full'
              />
              <p className='text-xs text-gray-500'>
                Exclude lineups with win probability below this threshold
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Exclusion Statistics */}
      {exclusionStats && settings.enableFiltering && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Portfolio Filter Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <div className='font-medium text-gray-700'>Original Lineups</div>
                <div className='text-2xl font-bold text-blue-600'>
                  {exclusionStats.original_lineups}
                </div>
              </div>
              <div>
                <div className='font-medium text-gray-700'>Filtered Lineups</div>
                <div className='text-2xl font-bold text-green-600'>
                  {exclusionStats.filtered_lineups}
                </div>
              </div>
            </div>

            {exclusionStats.excluded_lineups > 0 && (
              <div className='mt-4 p-3 bg-orange-50 rounded-lg'>
                <div className='font-medium text-orange-800 mb-2'>
                  {exclusionStats.excluded_lineups} lineups excluded:
                </div>
                <div className='space-y-1'>
                  {Object.entries(exclusionStats.exclusion_breakdown).map(
                    ([reason, count]) => (
                      <div key={reason} className='flex justify-between text-sm'>
                        <span className='text-orange-700'>
                          {reason
                            .replace(/_/g, ' ')
                            .replace(/([A-Z])/g, ' $1')
                            .toLowerCase()}
                        </span>
                        <Badge variant='secondary' className='text-xs'>
                          {count}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Portfolio Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Portfolio Guidelines</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='flex items-start gap-2'>
            <Target className='h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0' />
            <div>
              <div className='font-medium'>Duplicate Risk</div>
              <div className='text-gray-600'>
                Lower values create more unique lineups. 30-60% is typical for GPPs.
              </div>
            </div>
          </div>

          <div className='flex items-start gap-2'>
            <TrendingUp className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
            <div>
              <div className='font-medium'>Leverage Score</div>
              <div className='text-gray-600'>
                Positive values indicate contrarian plays. +5 to +15 is aggressive
                contrarian.
              </div>
            </div>
          </div>

          <div className='flex items-start gap-2'>
            <Zap className='h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0' />
            <div>
              <div className='font-medium'>ROI Floor</div>
              <div className='text-gray-600'>
                Minimum expected return. 10-20% is reasonable for GPPs, 5-10% for cash
                games.
              </div>
            </div>
          </div>

          <div className='flex items-start gap-2'>
            <Info className='h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0' />
            <div>
              <div className='font-medium'>Projected Ownership</div>
              <div className='text-gray-600'>
                Total ownership across all players. 150-250% is typical range.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
