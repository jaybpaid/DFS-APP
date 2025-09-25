import React, { useState } from 'react';
import {
  CogIcon,
  KeyIcon,
  BellIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CloudIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface SettingsState {
  apiKeys: {
    draftkings: string;
    fanduel: string;
    rotowire: string;
    stokastic: string;
  };
  optimization: {
    defaultLineupCount: number;
    defaultUniques: number;
    useProjections: boolean;
    useOwnership: boolean;
    useStacking: boolean;
    randomnessAmount: number;
  };
  notifications: {
    slateUpdates: boolean;
    optimizationComplete: boolean;
    simulationComplete: boolean;
    errorAlerts: boolean;
  };
  dataSync: {
    autoRefreshMinutes: number;
    cacheTimeout: number;
    preferLiveData: boolean;
    backupToCloud: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    apiKeys: {
      draftkings: '',
      fanduel: '',
      rotowire: '',
      stokastic: '',
    },
    optimization: {
      defaultLineupCount: 20,
      defaultUniques: 3,
      useProjections: true,
      useOwnership: true,
      useStacking: true,
      randomnessAmount: 10,
    },
    notifications: {
      slateUpdates: true,
      optimizationComplete: true,
      simulationComplete: true,
      errorAlerts: true,
    },
    dataSync: {
      autoRefreshMinutes: 5,
      cacheTimeout: 300,
      preferLiveData: true,
      backupToCloud: false,
    },
  });

  const [activeTab, setActiveTab] = useState<
    'api' | 'optimization' | 'notifications' | 'data'
  >('optimization');

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('dfs-settings', JSON.stringify(settings));
    // Show success toast
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'dfs-optimizer-settings.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const resetSettings = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings({
        apiKeys: { draftkings: '', fanduel: '', rotowire: '', stokastic: '' },
        optimization: {
          defaultLineupCount: 20,
          defaultUniques: 3,
          useProjections: true,
          useOwnership: true,
          useStacking: true,
          randomnessAmount: 10,
        },
        notifications: {
          slateUpdates: true,
          optimizationComplete: true,
          simulationComplete: true,
          errorAlerts: true,
        },
        dataSync: {
          autoRefreshMinutes: 5,
          cacheTimeout: 300,
          preferLiveData: true,
          backupToCloud: false,
        },
      });
    }
  };

  const tabs = [
    { id: 'optimization', name: 'Optimization', icon: CogIcon },
    { id: 'api', name: 'API Keys', icon: KeyIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'data', name: 'Data Sync', icon: CloudIcon },
  ] as const;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Settings</h1>
            <p className='text-gray-600'>
              Configure your DFS optimizer for optimal performance and data integration
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            <button
              onClick={exportSettings}
              className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              <DocumentArrowDownIcon className='w-4 h-4' />
              <span>Export</span>
            </button>

            <button
              onClick={resetSettings}
              className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              <ArrowPathIcon className='w-4 h-4' />
              <span>Reset</span>
            </button>

            <button
              onClick={handleSave}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700'
            >
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className='bg-white shadow rounded-lg'>
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8 px-6'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <tab.icon className='w-4 h-4' />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className='p-6'>
          {/* Optimization Settings */}
          {activeTab === 'optimization' && (
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Default Optimization Settings
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Default Lineup Count
                      </label>
                      <input
                        type='number'
                        min='1'
                        max='10000'
                        value={settings.optimization.defaultLineupCount}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            optimization: {
                              ...prev.optimization,
                              defaultLineupCount: parseInt(e.target.value),
                            },
                          }))
                        }
                        className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Default Different Players
                      </label>
                      <input
                        type='number'
                        min='1'
                        max='8'
                        value={settings.optimization.defaultUniques}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            optimization: {
                              ...prev.optimization,
                              defaultUniques: parseInt(e.target.value),
                            },
                          }))
                        }
                        className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        1-2 = Cash • 3-4 = GPP • 5-8 = Tournament
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Randomness Amount (%)
                      </label>
                      <input
                        type='range'
                        min='0'
                        max='50'
                        value={settings.optimization.randomnessAmount}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            optimization: {
                              ...prev.optimization,
                              randomnessAmount: parseInt(e.target.value),
                            },
                          }))
                        }
                        className='w-full'
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        Current: {settings.optimization.randomnessAmount}% variance
                      </div>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <h4 className='font-medium text-gray-900'>Default Features</h4>

                    <div className='space-y-3'>
                      <div className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={settings.optimization.useProjections}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              optimization: {
                                ...prev.optimization,
                                useProjections: e.target.checked,
                              },
                            }))
                          }
                          className='rounded border-gray-300 mr-3'
                        />
                        <div>
                          <label className='text-sm font-medium text-gray-700'>
                            Use Projections
                          </label>
                          <div className='text-xs text-gray-500'>
                            Include FPTS projections in optimization
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={settings.optimization.useOwnership}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              optimization: {
                                ...prev.optimization,
                                useOwnership: e.target.checked,
                              },
                            }))
                          }
                          className='rounded border-gray-300 mr-3'
                        />
                        <div>
                          <label className='text-sm font-medium text-gray-700'>
                            Consider Ownership
                          </label>
                          <div className='text-xs text-gray-500'>
                            Factor in ownership projections for GPP
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={settings.optimization.useStacking}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              optimization: {
                                ...prev.optimization,
                                useStacking: e.target.checked,
                              },
                            }))
                          }
                          className='rounded border-gray-300 mr-3'
                        />
                        <div>
                          <label className='text-sm font-medium text-gray-700'>
                            Enable Stacking
                          </label>
                          <div className='text-xs text-gray-500'>
                            Apply correlation rules for QB/WR stacks
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  API Integration
                </h3>
                <p className='text-sm text-gray-600 mb-6'>
                  Connect to professional DFS data sources for enhanced functionality
                </p>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      DraftKings API Key
                    </label>
                    <input
                      type='password'
                      value={settings.apiKeys.draftkings}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          apiKeys: { ...prev.apiKeys, draftkings: e.target.value },
                        }))
                      }
                      placeholder='Enter DraftKings API key'
                      className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                    />
                    <div className='text-xs text-gray-500 mt-1'>
                      Used for live salary and contest data fetching
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      FanDuel API Key
                    </label>
                    <input
                      type='password'
                      value={settings.apiKeys.fanduel}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          apiKeys: { ...prev.apiKeys, fanduel: e.target.value },
                        }))
                      }
                      placeholder='Enter FanDuel API key'
                      className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      RotoWire API Key
                    </label>
                    <input
                      type='password'
                      value={settings.apiKeys.rotowire}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          apiKeys: { ...prev.apiKeys, rotowire: e.target.value },
                        }))
                      }
                      placeholder='Enter RotoWire API key'
                      className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                    />
                    <div className='text-xs text-gray-500 mt-1'>
                      Used for projections and ownership data
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Stokastic API Key
                    </label>
                    <input
                      type='password'
                      value={settings.apiKeys.stokastic}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          apiKeys: { ...prev.apiKeys, stokastic: e.target.value },
                        }))
                      }
                      placeholder='Enter Stokastic API key'
                      className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Notification Preferences
                </h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-sm font-medium text-gray-700'>
                        Slate Updates
                      </div>
                      <div className='text-xs text-gray-500'>
                        Notify when new slates become available
                      </div>
                    </div>
                    <input
                      type='checkbox'
                      checked={settings.notifications.slateUpdates}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            slateUpdates: e.target.checked,
                          },
                        }))
                      }
                      className='rounded border-gray-300'
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-sm font-medium text-gray-700'>
                        Optimization Complete
                      </div>
                      <div className='text-xs text-gray-500'>
                        Notify when lineup generation finishes
                      </div>
                    </div>
                    <input
                      type='checkbox'
                      checked={settings.notifications.optimizationComplete}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            optimizationComplete: e.target.checked,
                          },
                        }))
                      }
                      className='rounded border-gray-300'
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-sm font-medium text-gray-700'>
                        Simulation Complete
                      </div>
                      <div className='text-xs text-gray-500'>
                        Notify when tournament simulations finish
                      </div>
                    </div>
                    <input
                      type='checkbox'
                      checked={settings.notifications.simulationComplete}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            simulationComplete: e.target.checked,
                          },
                        }))
                      }
                      className='rounded border-gray-300'
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-sm font-medium text-gray-700'>
                        Error Alerts
                      </div>
                      <div className='text-xs text-gray-500'>
                        Notify about system errors and issues
                      </div>
                    </div>
                    <input
                      type='checkbox'
                      checked={settings.notifications.errorAlerts}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            errorAlerts: e.target.checked,
                          },
                        }))
                      }
                      className='rounded border-gray-300'
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Sync */}
          {activeTab === 'data' && (
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Data Synchronization
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Auto Refresh (minutes)
                      </label>
                      <select
                        value={settings.dataSync.autoRefreshMinutes}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            dataSync: {
                              ...prev.dataSync,
                              autoRefreshMinutes: parseInt(e.target.value),
                            },
                          }))
                        }
                        className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                      >
                        <option value={1}>1 minute</option>
                        <option value={5}>5 minutes</option>
                        <option value={10}>10 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Cache Timeout (seconds)
                      </label>
                      <input
                        type='number'
                        min='60'
                        max='3600'
                        value={settings.dataSync.cacheTimeout}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            dataSync: {
                              ...prev.dataSync,
                              cacheTimeout: parseInt(e.target.value),
                            },
                          }))
                        }
                        className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                      />
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='text-sm font-medium text-gray-700'>
                          Prefer Live Data
                        </div>
                        <div className='text-xs text-gray-500'>
                          Use live API data over cached files
                        </div>
                      </div>
                      <input
                        type='checkbox'
                        checked={settings.dataSync.preferLiveData}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            dataSync: {
                              ...prev.dataSync,
                              preferLiveData: e.target.checked,
                            },
                          }))
                        }
                        className='rounded border-gray-300'
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='text-sm font-medium text-gray-700'>
                          Cloud Backup
                        </div>
                        <div className='text-xs text-gray-500'>
                          Automatically backup configurations
                        </div>
                      </div>
                      <input
                        type='checkbox'
                        checked={settings.dataSync.backupToCloud}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            dataSync: {
                              ...prev.dataSync,
                              backupToCloud: e.target.checked,
                            },
                          }))
                        }
                        className='rounded border-gray-300'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Tips */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Professional Configuration Tips
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='p-4 border border-blue-200 rounded-lg bg-blue-50'>
            <ShieldCheckIcon className='h-6 w-6 text-blue-600 mb-2' />
            <div className='font-medium text-blue-900 mb-1'>
              Security Best Practices
            </div>
            <div className='text-sm text-blue-700'>
              Never share API keys. Use environment variables in production deployments.
            </div>
          </div>

          <div className='p-4 border border-green-200 rounded-lg bg-green-50'>
            <ChartBarIcon className='h-6 w-6 text-green-600 mb-2' />
            <div className='font-medium text-green-900 mb-1'>
              Performance Optimization
            </div>
            <div className='text-sm text-green-700'>
              Use 5-minute cache timeout and live data preference for best balance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
