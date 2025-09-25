import React, { useState, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface VarianceTabProps {}

interface VarianceSettings {
  globalRandomness: number;
  distributionMode: 'normal' | 'lognormal' | 'uniform' | 'beta' | 'gamma';
  gameMode: 'gpp' | 'cash' | 'custom';
  positionVariance: {
    [key: string]: {
      enabled: boolean;
      percentage: number;
      min: number;
      max: number;
      skewness: number;
    };
  };
  ceilingFloorMode: {
    enabled: boolean;
    ceilingWeight: number;
    floorWeight: number;
    dynamicWeighting: boolean;
  };
  weatherAdjustments: {
    enabled: boolean;
    windThreshold: number;
    precipitationImpact: number;
    temperatureImpact: number;
    domeBonus: number;
  };
  ownershipVariance: {
    enabled: boolean;
    antiCorrelation: number;
    contrarianMode: boolean;
    ownershipThreshold: number;
  };
  correlationAwareVariance: {
    enabled: boolean;
    stackBoost: number;
    negativeCorrelationPenalty: number;
  };
  advancedOptions: {
    monteCarloSamples: number;
    confidenceInterval: number;
    tailRiskManagement: boolean;
    adaptivePenalties: boolean;
  };
}

export default function VarianceTab({}: VarianceTabProps) {
  const [varianceSettings, setVarianceSettings] = useState<VarianceSettings>({
    globalRandomness: 15,
    distributionMode: 'normal',
    gameMode: 'gpp',
    positionVariance: {
      QB: { enabled: true, percentage: 12, min: 5, max: 25, skewness: 0.1 },
      RB: { enabled: true, percentage: 18, min: 8, max: 35, skewness: 0.3 },
      WR: { enabled: true, percentage: 20, min: 10, max: 40, skewness: 0.4 },
      TE: { enabled: true, percentage: 16, min: 6, max: 30, skewness: 0.2 },
      DST: { enabled: true, percentage: 25, min: 15, max: 50, skewness: 0.5 },
    },
    ceilingFloorMode: {
      enabled: false,
      ceilingWeight: 0.3,
      floorWeight: 0.2,
      dynamicWeighting: false,
    },
    weatherAdjustments: {
      enabled: true,
      windThreshold: 15,
      precipitationImpact: 0.1,
      temperatureImpact: 0.05,
      domeBonus: 0.02,
    },
    ownershipVariance: {
      enabled: true,
      antiCorrelation: 0.15,
      contrarianMode: false,
      ownershipThreshold: 15,
    },
    correlationAwareVariance: {
      enabled: true,
      stackBoost: 0.08,
      negativeCorrelationPenalty: 0.12,
    },
    advancedOptions: {
      monteCarloSamples: 10000,
      confidenceInterval: 95,
      tailRiskManagement: true,
      adaptivePenalties: true,
    },
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'analytics'>(
    'basic'
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Game mode presets
  const gameModePresets = useMemo(
    () => ({
      gpp: {
        globalRandomness: 25,
        distributionMode: 'lognormal' as const,
        ceilingWeight: 0.4,
        floorWeight: 0.1,
        ownershipAntiCorrelation: 0.2,
      },
      cash: {
        globalRandomness: 8,
        distributionMode: 'normal' as const,
        ceilingWeight: 0.1,
        floorWeight: 0.4,
        ownershipAntiCorrelation: 0.05,
      },
      custom: varianceSettings,
    }),
    [varianceSettings]
  );

  const applyGameModePreset = (mode: 'gpp' | 'cash' | 'custom') => {
    if (mode === 'custom') return;

    const preset = gameModePresets[mode];
    setVarianceSettings(prev => ({
      ...prev,
      gameMode: mode,
      globalRandomness: preset.globalRandomness,
      distributionMode: preset.distributionMode,
      ceilingFloorMode: {
        ...prev.ceilingFloorMode,
        ceilingWeight: preset.ceilingWeight,
        floorWeight: preset.floorWeight,
      },
      ownershipVariance: {
        ...prev.ownershipVariance,
        antiCorrelation: preset.ownershipAntiCorrelation,
      },
    }));
  };

  const handleGlobalChange = (key: string, value: number | string | boolean) => {
    setVarianceSettings(prev => ({
      ...prev,
      [key]: value,
      gameMode: 'custom', // Switch to custom when manually adjusting
    }));
  };

  const handlePositionVariance = (position: string, field: string, value: number) => {
    setVarianceSettings(prev => ({
      ...prev,
      positionVariance: {
        ...prev.positionVariance,
        [position]: {
          ...prev.positionVariance[position],
          [field]: value,
        },
      },
      gameMode: 'custom',
    }));
  };

  const togglePositionVariance = (position: string) => {
    setVarianceSettings(prev => ({
      ...prev,
      positionVariance: {
        ...prev.positionVariance,
        [position]: {
          ...prev.positionVariance[position],
          enabled: !prev.positionVariance[position].enabled,
        },
      },
    }));
  };

  const runSimulation = async () => {
    setPreviewMode(true);
    // Simulate Monte Carlo analysis with variance settings
    setTimeout(() => {
      setSimulationResults({
        expectedLineupDiversity: Math.round(varianceSettings.globalRandomness * 2.5),
        projectedScore: {
          mean: 147.3,
          std: varianceSettings.globalRandomness * 1.2,
          percentile90: 162.8,
          percentile10: 128.4,
        },
        riskMetrics: {
          varianceRatio: varianceSettings.globalRandomness / 100,
          tailRisk: varianceSettings.advancedOptions.tailRiskManagement
            ? 'Low'
            : 'Medium',
          correlationImpact: varianceSettings.correlationAwareVariance.enabled
            ? 'Optimized'
            : 'Standard',
        },
      });
      setPreviewMode(false);
    }, 2000);
  };

  const renderBasicTab = () => (
    <div className='space-y-8'>
      {/* Game Mode Presets */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Game Mode Presets</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {(['gpp', 'cash', 'custom'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => applyGameModePreset(mode)}
              className={`p-4 rounded-lg border-2 transition-all ${
                varianceSettings.gameMode === mode
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className='text-sm font-medium mb-2'>
                {mode === 'gpp'
                  ? 'GPP (Tournament)'
                  : mode === 'cash'
                    ? 'Cash Games'
                    : 'Custom'}
              </div>
              <div className='text-xs text-gray-600'>
                {mode === 'gpp' && 'High variance, ceiling-focused'}
                {mode === 'cash' && 'Low variance, floor-focused'}
                {mode === 'custom' && 'Manual configuration'}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Global Randomness */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Global Randomness</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Projection Randomness ({varianceSettings.globalRandomness}%)
            </label>
            <input
              type='range'
              min='0'
              max='50'
              value={varianceSettings.globalRandomness}
              onChange={e =>
                handleGlobalChange('globalRandomness', parseInt(e.target.value))
              }
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
              title='Adjust global randomness percentage'
              aria-label='Global randomness percentage'
            />
            <p className='mt-1 text-xs text-gray-500'>
              Higher values create more lineup diversity but less predictable results
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Distribution Mode
            </label>
            <select
              value={varianceSettings.distributionMode}
              onChange={e => handleGlobalChange('distributionMode', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              title='Select distribution mode'
              aria-label='Distribution mode selection'
            >
              <option value='normal'>Normal Distribution</option>
              <option value='lognormal'>Log-Normal Distribution</option>
              <option value='uniform'>Uniform Distribution</option>
              <option value='beta'>Beta Distribution</option>
              <option value='gamma'>Gamma Distribution</option>
            </select>
            <p className='mt-1 text-xs text-gray-500'>
              {varianceSettings.distributionMode === 'normal' &&
                'Bell curve around projection'}
              {varianceSettings.distributionMode === 'lognormal' &&
                'Skewed toward higher outcomes'}
              {varianceSettings.distributionMode === 'uniform' &&
                'Equal probability across range'}
              {varianceSettings.distributionMode === 'beta' &&
                'Flexible shape parameters'}
              {varianceSettings.distributionMode === 'gamma' &&
                'Right-skewed with long tail'}
            </p>
          </div>
        </div>
      </Card>

      {/* Position-Specific Variance */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Position-Specific Variance
        </h3>
        <div className='space-y-4'>
          {Object.entries(varianceSettings.positionVariance).map(
            ([position, settings]) => (
              <div key={position} className='p-4 border border-gray-200 rounded-lg'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={settings.enabled}
                      onChange={() => togglePositionVariance(position)}
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                    <span className='text-sm font-medium text-gray-900 w-8'>
                      {position}
                    </span>
                    <span className='text-sm text-gray-500'>
                      {position === 'QB' && 'Quarterback'}
                      {position === 'RB' && 'Running Back'}
                      {position === 'WR' && 'Wide Receiver'}
                      {position === 'TE' && 'Tight End'}
                      {position === 'DST' && 'Defense/ST'}
                    </span>
                  </div>
                </div>

                {settings.enabled && (
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>
                        Variance %
                      </label>
                      <input
                        type='range'
                        min='0'
                        max='50'
                        value={settings.percentage}
                        onChange={e =>
                          handlePositionVariance(
                            position,
                            'percentage',
                            parseInt(e.target.value)
                          )
                        }
                        className='w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                        title={`${position} variance percentage`}
                        aria-label={`${position} variance percentage`}
                      />
                      <span className='text-xs text-gray-700'>
                        {settings.percentage}%
                      </span>
                    </div>

                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>Min %</label>
                      <input
                        type='range'
                        min='0'
                        max='30'
                        value={settings.min}
                        onChange={e =>
                          handlePositionVariance(
                            position,
                            'min',
                            parseInt(e.target.value)
                          )
                        }
                        className='w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                        title={`${position} minimum variance`}
                        aria-label={`${position} minimum variance`}
                      />
                      <span className='text-xs text-gray-700'>{settings.min}%</span>
                    </div>

                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>Max %</label>
                      <input
                        type='range'
                        min='20'
                        max='60'
                        value={settings.max}
                        onChange={e =>
                          handlePositionVariance(
                            position,
                            'max',
                            parseInt(e.target.value)
                          )
                        }
                        className='w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                        title={`${position} maximum variance`}
                        aria-label={`${position} maximum variance`}
                      />
                      <span className='text-xs text-gray-700'>{settings.max}%</span>
                    </div>

                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>
                        Skewness
                      </label>
                      <input
                        type='range'
                        min='-0.5'
                        max='0.5'
                        step='0.1'
                        value={settings.skewness}
                        onChange={e =>
                          handlePositionVariance(
                            position,
                            'skewness',
                            parseFloat(e.target.value)
                          )
                        }
                        className='w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                        title={`${position} distribution skewness`}
                        aria-label={`${position} distribution skewness`}
                      />
                      <span className='text-xs text-gray-700'>
                        {settings.skewness.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className='space-y-8'>
      {/* Ceiling/Floor Mode */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Ceiling/Floor Mode</h3>
        <div className='space-y-4'>
          <div className='flex items-center space-x-3'>
            <input
              type='checkbox'
              checked={varianceSettings.ceilingFloorMode.enabled}
              onChange={e =>
                setVarianceSettings(prev => ({
                  ...prev,
                  ceilingFloorMode: {
                    ...prev.ceilingFloorMode,
                    enabled: e.target.checked,
                  },
                }))
              }
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
            <label className='text-sm font-medium text-gray-700'>
              Enable Ceiling/Floor Projections
            </label>
          </div>

          {varianceSettings.ceilingFloorMode.enabled && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 pl-7'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Ceiling Weight ({varianceSettings.ceilingFloorMode.ceilingWeight})
                </label>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.1'
                  value={varianceSettings.ceilingFloorMode.ceilingWeight}
                  onChange={e =>
                    setVarianceSettings(prev => ({
                      ...prev,
                      ceilingFloorMode: {
                        ...prev.ceilingFloorMode,
                        ceilingWeight: parseFloat(e.target.value),
                      },
                    }))
                  }
                  className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                  title='Ceiling weight adjustment'
                  aria-label='Ceiling weight'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Floor Weight ({varianceSettings.ceilingFloorMode.floorWeight})
                </label>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.1'
                  value={varianceSettings.ceilingFloorMode.floorWeight}
                  onChange={e =>
                    setVarianceSettings(prev => ({
                      ...prev,
                      ceilingFloorMode: {
                        ...prev.ceilingFloorMode,
                        floorWeight: parseFloat(e.target.value),
                      },
                    }))
                  }
                  className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                  title='Floor weight adjustment'
                  aria-label='Floor weight'
                />
              </div>

              <div className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={varianceSettings.ceilingFloorMode.dynamicWeighting}
                  onChange={e =>
                    setVarianceSettings(prev => ({
                      ...prev,
                      ceilingFloorMode: {
                        ...prev.ceilingFloorMode,
                        dynamicWeighting: e.target.checked,
                      },
                    }))
                  }
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label className='text-sm text-gray-700'>Dynamic Weighting</label>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Weather & Environmental */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Weather & Environmental Adjustments
        </h3>
        <div className='space-y-4'>
          <div className='flex items-center space-x-3'>
            <input
              type='checkbox'
              checked={varianceSettings.weatherAdjustments.enabled}
              onChange={e =>
                setVarianceSettings(prev => ({
                  ...prev,
                  weatherAdjustments: {
                    ...prev.weatherAdjustments,
                    enabled: e.target.checked,
                  },
                }))
              }
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
            <label className='text-sm font-medium text-gray-700'>
              Apply Weather-Based Variance
            </label>
          </div>

          {varianceSettings.weatherAdjustments.enabled && (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6 pl-7'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Wind Threshold ({varianceSettings.weatherAdjustments.windThreshold}{' '}
                  mph)
                </label>
                <input
                  type='range'
                  min='5'
                  max='30'
                  value={varianceSettings.weatherAdjustments.windThreshold}
                  onChange={e =>
                    setVarianceSettings(prev => ({
                      ...prev,
                      weatherAdjustments: {
                        ...prev.weatherAdjustments,
                        windThreshold: parseInt(e.target.value),
                      },
                    }))
                  }
                  className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                  title='Wind threshold in mph'
                  aria-label='Wind threshold'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Precipitation Impact (
                  {(
                    varianceSettings.weatherAdjustments.precipitationImpact * 100
                  ).toFixed(0)}
                  %)
                </label>
                <input
                  type='range'
                  min='0'
                  max='0.5'
                  step='0.05'
                  value={varianceSettings.weatherAdjustments.precipitationImpact}
                  onChange={e =>
                    setVarianceSettings(prev => ({
                      ...prev,
                      weatherAdjustments: {
                        ...prev.weatherAdjustments,
                        precipitationImpact: parseFloat(e.target.value),
                      },
                    }))
                  }
                  className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                  title='Precipitation impact percentage'
                  aria-label='Precipitation impact'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Temperature Impact (
                  {(
                    varianceSettings.weatherAdjustments.temperatureImpact * 100
                  ).toFixed(0)}
                  %)
                </label>
                <input
                  type='range'
                  min='0'
                  max='0.2'
                  step='0.01'
                  value={varianceSettings.weatherAdjustments.temperatureImpact}
                  onChange={e =>
                    setVarianceSettings(prev => ({
                      ...prev,
                      weatherAdjustments: {
                        ...prev.weatherAdjustments,
                        temperatureImpact: parseFloat(e.target.value),
                      },
                    }))
                  }
                  className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                  title='Temperature impact percentage'
                  aria-label='Temperature impact'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Dome Bonus (
                  {(varianceSettings.weatherAdjustments.domeBonus * 100).toFixed(0)}%)
                </label>
                <input
                  type='range'
                  min='0'
                  max='0.1'
                  step='0.01'
                  value={varianceSettings.weatherAdjustments.domeBonus}
                  onChange={e =>
                    setVarianceSettings(prev => ({
                      ...prev,
                      weatherAdjustments: {
                        ...prev.weatherAdjustments,
                        domeBonus: parseFloat(e.target.value),
                      },
                    }))
                  }
                  className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                  title='Dome game bonus percentage'
                  aria-label='Dome bonus'
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Ownership & Correlation Variance */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Ownership & Correlation Variance
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <input
                type='checkbox'
                checked={varianceSettings.ownershipVariance.enabled}
                onChange={e =>
                  setVarianceSettings(prev => ({
                    ...prev,
                    ownershipVariance: {
                      ...prev.ownershipVariance,
                      enabled: e.target.checked,
                    },
                  }))
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='text-sm font-medium text-gray-700'>
                Ownership-Based Variance
              </label>
            </div>

            {varianceSettings.ownershipVariance.enabled && (
              <div className='space-y-4 pl-7'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Anti-Correlation (
                    {(varianceSettings.ownershipVariance.antiCorrelation * 100).toFixed(
                      0
                    )}
                    %)
                  </label>
                  <input
                    type='range'
                    min='0'
                    max='0.5'
                    step='0.05'
                    value={varianceSettings.ownershipVariance.antiCorrelation}
                    onChange={e =>
                      setVarianceSettings(prev => ({
                        ...prev,
                        ownershipVariance: {
                          ...prev.ownershipVariance,
                          antiCorrelation: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                    title='Ownership anti-correlation strength'
                    aria-label='Ownership anti-correlation'
                  />
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={varianceSettings.ownershipVariance.contrarianMode}
                    onChange={e =>
                      setVarianceSettings(prev => ({
                        ...prev,
                        ownershipVariance: {
                          ...prev.ownershipVariance,
                          contrarianMode: e.target.checked,
                        },
                      }))
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <label className='text-sm text-gray-700'>Contrarian Mode</label>
                </div>
              </div>
            )}
          </div>

          <div className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <input
                type='checkbox'
                checked={varianceSettings.correlationAwareVariance.enabled}
                onChange={e =>
                  setVarianceSettings(prev => ({
                    ...prev,
                    correlationAwareVariance: {
                      ...prev.correlationAwareVariance,
                      enabled: e.target.checked,
                    },
                  }))
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='text-sm font-medium text-gray-700'>
                Correlation-Aware Variance
              </label>
            </div>

            {varianceSettings.correlationAwareVariance.enabled && (
              <div className='space-y-4 pl-7'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Stack Boost (
                    {(
                      varianceSettings.correlationAwareVariance.stackBoost * 100
                    ).toFixed(0)}
                    %)
                  </label>
                  <input
                    type='range'
                    min='0'
                    max='0.2'
                    step='0.02'
                    value={varianceSettings.correlationAwareVariance.stackBoost}
                    onChange={e =>
                      setVarianceSettings(prev => ({
                        ...prev,
                        correlationAwareVariance: {
                          ...prev.correlationAwareVariance,
                          stackBoost: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                    title='Stack correlation boost'
                    aria-label='Stack boost'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Negative Correlation Penalty (
                    {(
                      varianceSettings.correlationAwareVariance
                        .negativeCorrelationPenalty * 100
                    ).toFixed(0)}
                    %)
                  </label>
                  <input
                    type='range'
                    min='0'
                    max='0.3'
                    step='0.02'
                    value={
                      varianceSettings.correlationAwareVariance
                        .negativeCorrelationPenalty
                    }
                    onChange={e =>
                      setVarianceSettings(prev => ({
                        ...prev,
                        correlationAwareVariance: {
                          ...prev.correlationAwareVariance,
                          negativeCorrelationPenalty: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                    title='Negative correlation penalty'
                    aria-label='Negative correlation penalty'
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className='space-y-8'>
      {/* Variance Simulation */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            Variance Impact Simulation
          </h3>
          <Button
            onClick={runSimulation}
            disabled={previewMode}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            {previewMode ? 'Running...' : 'Run Simulation'}
          </Button>
        </div>

        {simulationResults && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='p-4 bg-blue-50 rounded-lg'>
              <h4 className='text-sm font-medium text-blue-900 mb-2'>
                Lineup Diversity
              </h4>
              <div className='text-2xl font-bold text-blue-600'>
                {simulationResults.expectedLineupDiversity}
              </div>
              <p className='text-xs text-blue-700'>Expected unique lineups</p>
            </div>

            <div className='p-4 bg-green-50 rounded-lg'>
              <h4 className='text-sm font-medium text-green-900 mb-2'>
                Projected Score
              </h4>
              <div className='text-2xl font-bold text-green-600'>
                {simulationResults.projectedScore.mean.toFixed(1)}
              </div>
              <p className='text-xs text-green-700'>
                ±{simulationResults.projectedScore.std.toFixed(1)} std dev
              </p>
            </div>

            <div className='p-4 bg-purple-50 rounded-lg'>
              <h4 className='text-sm font-medium text-purple-900 mb-2'>Risk Level</h4>
              <div className='text-2xl font-bold text-purple-600'>
                {simulationResults.riskMetrics.tailRisk}
              </div>
              <p className='text-xs text-purple-700'>
                Variance ratio:{' '}
                {(simulationResults.riskMetrics.varianceRatio * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {previewMode && (
          <div className='mt-4 flex items-center justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-2 text-gray-600'>
              Running Monte Carlo simulation...
            </span>
          </div>
        )}
      </Card>

      {/* Variance Configuration Summary */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Current Configuration Summary
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Game Mode:</span>
              <Badge
                className={`${
                  varianceSettings.gameMode === 'gpp'
                    ? 'bg-red-100 text-red-800'
                    : varianceSettings.gameMode === 'cash'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {varianceSettings.gameMode.toUpperCase()}
              </Badge>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Global Randomness:</span>
              <span className='text-sm font-medium'>
                {varianceSettings.globalRandomness}%
              </span>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Distribution:</span>
              <span className='text-sm font-medium capitalize'>
                {varianceSettings.distributionMode}
              </span>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Active Positions:</span>
              <span className='text-sm font-medium'>
                {
                  Object.values(varianceSettings.positionVariance).filter(
                    p => p.enabled
                  ).length
                }
                /5
              </span>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Ceiling/Floor Mode:</span>
              <Badge
                className={
                  varianceSettings.ceilingFloorMode.enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {varianceSettings.ceilingFloorMode.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Weather Adjustments:</span>
              <Badge
                className={
                  varianceSettings.weatherAdjustments.enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {varianceSettings.weatherAdjustments.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Ownership Variance:</span>
              <Badge
                className={
                  varianceSettings.ownershipVariance.enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {varianceSettings.ownershipVariance.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Correlation Aware:</span>
              <Badge
                className={
                  varianceSettings.correlationAwareVariance.enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {varianceSettings.correlationAwareVariance.enabled
                  ? 'Enabled'
                  : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-medium text-gray-900'>
              Advanced Variance Control Panel
            </h2>
            <p className='mt-1 text-sm text-gray-500'>
              Configure projection randomness, distribution settings, and risk
              management
            </p>
          </div>

          <div className='flex items-center space-x-2'>
            <Badge className='bg-blue-100 text-blue-800'>
              {varianceSettings.gameMode.toUpperCase()} Mode
            </Badge>
            <Badge
              className={`${
                varianceSettings.globalRandomness > 25
                  ? 'bg-red-100 text-red-800'
                  : varianceSettings.globalRandomness > 15
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }`}
            >
              {varianceSettings.globalRandomness > 25
                ? 'High'
                : varianceSettings.globalRandomness > 15
                  ? 'Medium'
                  : 'Low'}{' '}
              Variance
            </Badge>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='flex space-x-8 px-6'>
          {[
            { key: 'basic', label: 'Basic Settings', icon: '⚙️' },
            { key: 'advanced', label: 'Advanced Controls', icon: '🎛️' },
            { key: 'analytics', label: 'Analytics & Preview', icon: '📊' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className='mr-2'>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className='p-6'>
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'advanced' && renderAdvancedTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
}
