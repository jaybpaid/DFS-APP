'use client';

import React, { useState, useEffect } from 'react';
import { useDfsStore } from '../../../store/dfs-store';
import ProfessionalSlateSelector from '../../../components/ProfessionalSlateSelector';
import PlayerPoolTable from '../../../components/PlayerPoolTable';
import ConstraintsTab from '../../../components/optimizer/ConstraintsTab';
import StacksTab from '../../../components/optimizer/StacksTab';
import VarianceTab from '../../../components/optimizer/VarianceTab';
import OwnershipTab from '../../../components/optimizer/OwnershipTab';
import CorrelationsTab from '../../../components/optimizer/CorrelationsTab';
import SimsTab from '../../../components/optimizer/SimsTab';
import ResultsTab from '../../../components/optimizer/ResultsTab';

type TabType =
  | 'players'
  | 'constraints'
  | 'stacks'
  | 'variance'
  | 'ownership'
  | 'correlations'
  | 'sims'
  | 'results';

export default function AdvancedOptimizerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('players');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedLineups, setOptimizedLineups] = useState<any[]>([]);

  const {
    selectedSlateId,
    getPlayersForSlate,
    isSlateLoading,
    getSlateError,
    fetchPlayersForSlate,
  } = useDfsStore();

  const players = selectedSlateId ? getPlayersForSlate(selectedSlateId) : [];
  const isLoading = selectedSlateId ? isSlateLoading(selectedSlateId) : false;
  const error = selectedSlateId ? getSlateError(selectedSlateId) : null;

  // Fetch players when slate changes
  useEffect(() => {
    if (selectedSlateId) {
      fetchPlayersForSlate(selectedSlateId);
    }
  }, [selectedSlateId, fetchPlayersForSlate]);

  const handleOptimize = async () => {
    if (!selectedSlateId) {
      alert('Please select a slate first');
      return;
    }

    setIsOptimizing(true);
    try {
      // Call the Python API to optimize lineups
      const response = await fetch('http://localhost:8000/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slate_id: selectedSlateId,
          lineup_count: 150,
          uniqueness: 3,
          max_from_team: 4,
          stacks: [{ type: 'QB+2', team: '*', bring_back: 1 }],
          exposure_caps: {},
          randomness_pct: 15,
          ownership_fade: 'medium',
          seed: 42,
        }),
      });

      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.statusText}`);
      }

      const data = await response.json();
      setOptimizedLineups(data.lineups || []);
      setActiveTab('results');
    } catch (error) {
      console.error('Optimization error:', error);
      alert(
        `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const tabs = [
    { id: 'players', label: 'Player Pool', count: players.length },
    { id: 'constraints', label: 'Constraints', count: null },
    { id: 'stacks', label: 'Stacks & Groups', count: null },
    { id: 'variance', label: 'Variance', count: null },
    { id: 'ownership', label: 'Ownership', count: null },
    { id: 'correlations', label: 'Correlations', count: null },
    { id: 'sims', label: 'Sims', count: null },
    { id: 'results', label: 'Results', count: optimizedLineups.length },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-4'>
              <h1 className='text-xl font-semibold text-gray-900'>
                Advanced DFS Optimizer
              </h1>
              <div className='w-80'>
                <ProfessionalSlateSelector />
              </div>
            </div>
            <button
              onClick={handleOptimize}
              disabled={!selectedSlateId || isOptimizing || players.length === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                !selectedSlateId || isOptimizing || players.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isOptimizing ? 'Optimizing...' : 'Run Optimize (150 Lineups)'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <nav className='flex space-x-8' aria-label='Tabs'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-md p-4'>
            <div className='flex'>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>Error</h3>
                <div className='mt-2 text-sm text-red-700'>{error}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className='bg-white rounded-lg shadow'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h2 className='text-lg font-medium text-gray-900'>Player Pool</h2>
              <p className='mt-1 text-sm text-gray-500'>
                {selectedSlateId
                  ? `${players.length} players available for optimization`
                  : 'Select a slate to view players'}
              </p>
            </div>
            <div className='p-6'>
              <PlayerPoolTable players={players} isLoading={isLoading} />
            </div>
          </div>
        )}

        {activeTab === 'constraints' && <ConstraintsTab />}

        {activeTab === 'stacks' && <StacksTab />}

        {activeTab === 'variance' && <VarianceTab />}

        {activeTab === 'ownership' && <OwnershipTab />}

        {activeTab === 'correlations' && <CorrelationsTab />}

        {activeTab === 'sims' && <SimsTab />}

        {activeTab === 'results' && (
          <ResultsTab lineups={optimizedLineups} isOptimizing={isOptimizing} />
        )}
      </div>
    </div>
  );
}
