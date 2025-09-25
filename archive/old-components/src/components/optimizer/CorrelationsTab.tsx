import React, { useState, useMemo } from 'react';

interface CorrelationData {
  player1: string;
  player2: string;
  correlation: number;
  type: 'positive' | 'negative' | 'neutral';
  reason: string;
}

interface CorrelationsTabProps {}

export default function CorrelationsTab({}: CorrelationsTabProps) {
  const [correlationSettings, setCorrelationSettings] = useState({
    enableCorrelations: true,
    stackCorrelation: 0.8,
    gameCorrelation: 0.6,
    negativeCorrelation: -0.4,
    weatherImpact: 0.3,
    paceImpact: 0.2,
  });

  // Mock correlation data - in real app this would come from MCP servers
  const correlationMatrix = useMemo(() => {
    const mockData: CorrelationData[] = [
      {
        player1: 'Josh Allen',
        player2: 'Stefon Diggs',
        correlation: 0.85,
        type: 'positive',
        reason: 'QB-WR stack correlation',
      },
      {
        player1: 'Josh Allen',
        player2: 'Bills DST',
        correlation: -0.3,
        type: 'negative',
        reason: 'QB vs opposing defense',
      },
      {
        player1: 'Christian McCaffrey',
        player2: '49ers DST',
        correlation: 0.4,
        type: 'positive',
        reason: 'Game script correlation',
      },
      {
        player1: 'Patrick Mahomes',
        player2: 'Travis Kelce',
        correlation: 0.78,
        type: 'positive',
        reason: 'QB-TE stack correlation',
      },
      {
        player1: 'Derrick Henry',
        player2: 'Ryan Tannehill',
        correlation: 0.45,
        type: 'positive',
        reason: 'Game script correlation',
      },
    ];
    return mockData;
  }, []);

  const getCorrelationColor = (correlation: number) => {
    if (correlation > 0.7) return 'text-green-600 font-bold';
    if (correlation > 0.4) return 'text-green-500';
    if (correlation > 0.1) return 'text-blue-500';
    if (correlation > -0.1) return 'text-gray-500';
    if (correlation > -0.4) return 'text-orange-500';
    return 'text-red-500 font-bold';
  };

  const getCorrelationBg = (correlation: number) => {
    if (correlation > 0.7) return 'bg-green-100';
    if (correlation > 0.4) return 'bg-green-50';
    if (correlation > 0.1) return 'bg-blue-50';
    if (correlation > -0.1) return 'bg-gray-50';
    if (correlation > -0.4) return 'bg-orange-50';
    return 'bg-red-100';
  };

  const handleSettingChange = (key: string, value: number | boolean) => {
    setCorrelationSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <h2 className='text-lg font-medium text-gray-900'>
          Correlations & Game Theory
        </h2>
        <p className='mt-1 text-sm text-gray-500'>
          Configure player correlations, stack relationships, and game script
          dependencies
        </p>
      </div>

      <div className='p-6 space-y-8'>
        {/* Correlation Settings */}
        <div>
          <h3 className='text-md font-medium text-gray-900 mb-4'>
            Correlation Settings
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <div>
              <div className='flex items-center space-x-3 mb-2'>
                <input
                  type='checkbox'
                  checked={correlationSettings.enableCorrelations}
                  onChange={e =>
                    handleSettingChange('enableCorrelations', e.target.checked)
                  }
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label className='text-sm font-medium text-gray-700'>
                  Enable Correlations
                </label>
              </div>
              <p className='text-xs text-gray-500'>
                Apply correlation adjustments to lineup generation
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Stack Correlation ({correlationSettings.stackCorrelation})
              </label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.05'
                value={correlationSettings.stackCorrelation}
                onChange={e =>
                  handleSettingChange('stackCorrelation', parseFloat(e.target.value))
                }
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-xs text-gray-500 mt-1'>
                QB-WR/TE correlation strength
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Game Correlation ({correlationSettings.gameCorrelation})
              </label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.05'
                value={correlationSettings.gameCorrelation}
                onChange={e =>
                  handleSettingChange('gameCorrelation', parseFloat(e.target.value))
                }
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-xs text-gray-500 mt-1'>Same-game player correlation</p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Negative Correlation ({correlationSettings.negativeCorrelation})
              </label>
              <input
                type='range'
                min='-1'
                max='0'
                step='0.05'
                value={correlationSettings.negativeCorrelation}
                onChange={e =>
                  handleSettingChange('negativeCorrelation', parseFloat(e.target.value))
                }
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-xs text-gray-500 mt-1'>
                QB vs opposing defense correlation
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Weather Impact ({correlationSettings.weatherImpact})
              </label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.05'
                value={correlationSettings.weatherImpact}
                onChange={e =>
                  handleSettingChange('weatherImpact', parseFloat(e.target.value))
                }
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-xs text-gray-500 mt-1'>
                Weather-based correlation adjustments
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Pace Impact ({correlationSettings.paceImpact})
              </label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.05'
                value={correlationSettings.paceImpact}
                onChange={e =>
                  handleSettingChange('paceImpact', parseFloat(e.target.value))
                }
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-xs text-gray-500 mt-1'>Game pace correlation impact</p>
            </div>
          </div>
        </div>

        {/* Correlation Matrix */}
        <div>
          <h3 className='text-md font-medium text-gray-900 mb-4'>
            Player Correlation Matrix
          </h3>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Player 1
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Player 2
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Correlation
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {correlationMatrix.map((correlation, index) => (
                  <tr key={index} className={getCorrelationBg(correlation.correlation)}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {correlation.player1}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {correlation.player2}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getCorrelationColor(correlation.correlation)}`}
                    >
                      {correlation.correlation.toFixed(2)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          correlation.type === 'positive'
                            ? 'bg-green-100 text-green-800'
                            : correlation.type === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {correlation.type}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {correlation.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Correlation Rules */}
        <div>
          <h3 className='text-md font-medium text-gray-900 mb-4'>Correlation Rules</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <h4 className='text-sm font-medium text-gray-900'>
                Positive Correlations
              </h4>
              <div className='space-y-2 text-sm text-gray-600'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                  <span>QB + WR/TE from same team (stack correlation)</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                  <span>RB + Team Defense (game script)</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-blue-400 rounded-full'></div>
                  <span>High-pace game players</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-blue-300 rounded-full'></div>
                  <span>Same-game bring-back plays</span>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <h4 className='text-sm font-medium text-gray-900'>
                Negative Correlations
              </h4>
              <div className='space-y-2 text-sm text-gray-600'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                  <span>QB vs opposing team defense</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                  <span>RB vs opposing team RB</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-orange-400 rounded-full'></div>
                  <span>Weather-impacted passing games</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-orange-300 rounded-full'></div>
                  <span>Low-pace game players</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Theory Insights */}
        <div>
          <h3 className='text-md font-medium text-gray-900 mb-4'>
            Game Theory Insights
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='bg-blue-50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-blue-900 mb-2'>Stack Theory</h4>
              <p className='text-sm text-blue-800'>
                QB-WR stacks provide ceiling correlation. When QB throws TD, WR likely
                benefits. Optimal for GPP tournaments seeking high-ceiling outcomes.
              </p>
            </div>

            <div className='bg-green-50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-green-900 mb-2'>Game Script</h4>
              <p className='text-sm text-green-800'>
                Leading teams run more (RB+), trailing teams pass more (QB/WR+). Vegas
                lines and pace metrics inform correlation strength.
              </p>
            </div>

            <div className='bg-purple-50 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-purple-900 mb-2'>Bring-Back</h4>
              <p className='text-sm text-purple-800'>
                Opposing team players hedge stack risk. If your QB stack fails,
                bring-back players may benefit from game flow.
              </p>
            </div>
          </div>
        </div>

        {/* Correlation Summary */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>
            Correlation Configuration Summary
          </h4>
          <div className='text-sm text-gray-700 space-y-1'>
            <p>
              • Correlations:{' '}
              {correlationSettings.enableCorrelations ? 'Enabled' : 'Disabled'}
            </p>
            <p>
              • Stack correlation strength:{' '}
              {(correlationSettings.stackCorrelation * 100).toFixed(0)}%
            </p>
            <p>
              • Game correlation impact:{' '}
              {(correlationSettings.gameCorrelation * 100).toFixed(0)}%
            </p>
            <p>
              • Negative correlation penalty:{' '}
              {(Math.abs(correlationSettings.negativeCorrelation) * 100).toFixed(0)}%
            </p>
            <p>
              • Weather/pace adjustments:{' '}
              {(correlationSettings.weatherImpact * 100).toFixed(0)}% /{' '}
              {(correlationSettings.paceImpact * 100).toFixed(0)}%
            </p>
            <p>• Matrix entries: {correlationMatrix.length} player pairs analyzed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
