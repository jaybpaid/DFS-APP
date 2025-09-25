import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert } from './ui/alert';

interface Lineup {
  id: string;
  name: string;
  players: Player[];
  totalSalary: number;
  projectedScore: number;
  projectedOwnership: number;
  riskScore: number;
  correlationScore: number;
  uniqueness: number;
  contestTypes: string[];
  status: 'active' | 'paused' | 'completed';
  entryFee: number;
  expectedValue: number;
  roi: number;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projection: number;
  ownership: number;
  value: number;
}

interface Contest {
  id: string;
  name: string;
  entryFee: number;
  totalEntries: number;
  maxEntries: number;
  payoutStructure: 'top_heavy' | 'flat' | 'winner_take_all';
  type: 'gpp' | 'cash' | 'satellite';
  sport: string;
  slate: string;
  startTime: string;
  prizePool: number;
}

interface PortfolioSettings {
  maxExposure: number;
  correlationLimit: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  diversificationTarget: number;
  bankrollPercentage: number;
  autoRebalance: boolean;
  hedgingEnabled: boolean;
  kellyCriterion: boolean;
}

interface PortfolioManagerDashboardProps {
  lineups?: Lineup[];
  contests?: Contest[];
  onLineupsUpdate?: (lineups: Lineup[]) => void;
}

export default function PortfolioManagerDashboard({
  onLineupsUpdate,
}: PortfolioManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'lineups' | 'exposure' | 'contests' | 'analytics' | 'settings'
  >('overview');
  const [portfolioSettings, setPortfolioSettings] = useState<PortfolioSettings>({
    maxExposure: 25,
    correlationLimit: 0.6,
    riskTolerance: 'moderate',
    diversificationTarget: 80,
    bankrollPercentage: 5,
    autoRebalance: true,
    hedgingEnabled: false,
    kellyCriterion: true,
  });

  const [selectedLineups, setSelectedLineups] = useState<string[]>([]);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<any>(null);
  const [liveTracking, setLiveTracking] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Mock data for demonstration
  const mockLineups: Lineup[] = useMemo(
    () => [
      {
        id: '1',
        name: 'High Ceiling Stack',
        players: [],
        totalSalary: 49800,
        projectedScore: 156.4,
        projectedOwnership: 8.2,
        riskScore: 7.8,
        correlationScore: 0.75,
        uniqueness: 92,
        contestTypes: ['gpp'],
        status: 'active',
        entryFee: 25,
        expectedValue: 8.5,
        roi: 0.34,
      },
      {
        id: '2',
        name: 'Safe Cash Play',
        players: [],
        totalSalary: 49600,
        projectedScore: 143.2,
        projectedOwnership: 15.6,
        riskScore: 4.2,
        correlationScore: 0.32,
        uniqueness: 76,
        contestTypes: ['cash'],
        status: 'active',
        entryFee: 10,
        expectedValue: 2.1,
        roi: 0.21,
      },
      {
        id: '3',
        name: 'Contrarian GPP',
        players: [],
        totalSalary: 49750,
        projectedScore: 151.8,
        projectedOwnership: 4.1,
        riskScore: 8.9,
        correlationScore: 0.18,
        uniqueness: 97,
        contestTypes: ['gpp'],
        status: 'active',
        entryFee: 50,
        expectedValue: 22.5,
        roi: 0.45,
      },
    ],
    []
  );

  const mockContests: Contest[] = useMemo(
    () => [
      {
        id: '1',
        name: 'Sunday Million',
        entryFee: 25,
        totalEntries: 45000,
        maxEntries: 150,
        payoutStructure: 'top_heavy',
        type: 'gpp',
        sport: 'NFL',
        slate: 'Main',
        startTime: '2025-09-21T17:00:00Z',
        prizePool: 1000000,
      },
      {
        id: '2',
        name: 'Double Up',
        entryFee: 10,
        totalEntries: 2000,
        maxEntries: 1,
        payoutStructure: 'flat',
        type: 'cash',
        sport: 'NFL',
        slate: 'Main',
        startTime: '2025-09-21T17:00:00Z',
        prizePool: 18000,
      },
    ],
    []
  );

  const portfolioMetrics = useMemo(() => {
    const totalExposure = mockLineups.reduce((sum, lineup) => sum + lineup.entryFee, 0);
    const totalEV = mockLineups.reduce((sum, lineup) => sum + lineup.expectedValue, 0);
    const averageROI =
      mockLineups.reduce((sum, lineup) => sum + lineup.roi, 0) / mockLineups.length;
    const averageOwnership =
      mockLineups.reduce((sum, lineup) => sum + lineup.projectedOwnership, 0) /
      mockLineups.length;

    return {
      totalExposure,
      totalEV,
      netEV: totalEV - totalExposure,
      averageROI,
      averageOwnership,
      portfolioRisk:
        mockLineups.reduce((sum, lineup) => sum + lineup.riskScore, 0) /
        mockLineups.length,
      diversificationScore:
        mockLineups.reduce((sum, lineup) => sum + lineup.uniqueness, 0) /
        mockLineups.length,
    };
  }, [mockLineups]);

  const runPortfolioOptimization = () => {
    // Simulate portfolio optimization
    setPortfolioAnalysis({
      optimalAllocation: {
        'High Ceiling Stack': 0.4,
        'Safe Cash Play': 0.3,
        'Contrarian GPP': 0.3,
      },
      riskAdjustedReturn: 0.28,
      maxDrawdown: 0.15,
      sharpeRatio: 1.85,
      correlationMatrix: [
        [1.0, 0.25, -0.15],
        [0.25, 1.0, 0.42],
        [-0.15, 0.42, 1.0],
      ],
      recommendations: [
        'Reduce exposure to correlated plays',
        'Consider hedging with contrarian lineups',
        'Optimal bankroll allocation: 4.2%',
      ],
    });
  };

  const renderOverviewTab = () => (
    <div className='space-y-8'>
      {/* Portfolio Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Exposure</p>
              <p className='text-2xl font-bold text-gray-900'>
                ${portfolioMetrics.totalExposure}
              </p>
            </div>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <span className='text-blue-600 text-xl'>💰</span>
            </div>
          </div>
          <div className='mt-2'>
            <span className='text-sm text-gray-500'>
              {(
                (portfolioMetrics.totalExposure / 1000) *
                portfolioSettings.bankrollPercentage
              ).toFixed(1)}
              % of bankroll
            </span>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Expected Value</p>
              <p className='text-2xl font-bold text-green-600'>
                ${portfolioMetrics.totalEV.toFixed(2)}
              </p>
            </div>
            <div className='p-2 bg-green-100 rounded-lg'>
              <span className='text-green-600 text-xl'>📈</span>
            </div>
          </div>
          <div className='mt-2'>
            <span
              className={`text-sm ${portfolioMetrics.netEV > 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              Net EV: ${portfolioMetrics.netEV.toFixed(2)}
            </span>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Average ROI</p>
              <p className='text-2xl font-bold text-purple-600'>
                {(portfolioMetrics.averageROI * 100).toFixed(1)}%
              </p>
            </div>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <span className='text-purple-600 text-xl'>🎯</span>
            </div>
          </div>
          <div className='mt-2'>
            <Badge
              className={`${
                portfolioMetrics.averageROI > 0.2
                  ? 'bg-green-100 text-green-800'
                  : portfolioMetrics.averageROI > 0.1
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {portfolioMetrics.averageROI > 0.2
                ? 'Excellent'
                : portfolioMetrics.averageROI > 0.1
                  ? 'Good'
                  : 'Needs Work'}
            </Badge>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Portfolio Risk</p>
              <p className='text-2xl font-bold text-orange-600'>
                {portfolioMetrics.portfolioRisk.toFixed(1)}
              </p>
            </div>
            <div className='p-2 bg-orange-100 rounded-lg'>
              <span className='text-orange-600 text-xl'>⚠️</span>
            </div>
          </div>
          <div className='mt-2'>
            <Badge
              className={`${
                portfolioMetrics.portfolioRisk < 5
                  ? 'bg-green-100 text-green-800'
                  : portfolioMetrics.portfolioRisk < 7
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {portfolioMetrics.portfolioRisk < 5
                ? 'Conservative'
                : portfolioMetrics.portfolioRisk < 7
                  ? 'Moderate'
                  : 'Aggressive'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Live Tracking & Alerts */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>Live Portfolio Tracking</h3>
          <div className='flex items-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full ${liveTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
            ></div>
            <span className='text-sm text-gray-600'>
              {liveTracking ? 'Live' : 'Paused'}
            </span>
            <Button
              onClick={() => setLiveTracking(!liveTracking)}
              className='text-xs px-2 py-1'
            >
              {liveTracking ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <h4 className='text-sm font-medium text-gray-700 mb-3'>Recent Activity</h4>
            <div className='space-y-3'>
              <div className='flex items-center space-x-3 p-3 bg-blue-50 rounded-lg'>
                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-blue-900'>
                    Lineup optimization completed
                  </p>
                  <p className='text-xs text-blue-700'>Expected ROI increased by 12%</p>
                </div>
                <span className='text-xs text-blue-600'>2m ago</span>
              </div>

              <div className='flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg'>
                <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-yellow-900'>
                    High correlation detected
                  </p>
                  <p className='text-xs text-yellow-700'>
                    Consider diversifying RB exposure
                  </p>
                </div>
                <span className='text-xs text-yellow-600'>5m ago</span>
              </div>

              <div className='flex items-center space-x-3 p-3 bg-green-50 rounded-lg'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-green-900'>
                    Contest entries submitted
                  </p>
                  <p className='text-xs text-green-700'>
                    3 lineups entered successfully
                  </p>
                </div>
                <span className='text-xs text-green-600'>8m ago</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className='text-sm font-medium text-gray-700 mb-3'>
              Performance Tracking
            </h4>
            <div className='space-y-4'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-sm text-gray-600'>Current Week ROI</span>
                  <span className='text-sm font-bold text-green-600'>+24.3%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-green-500 h-2 rounded-full'
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </div>

              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-sm text-gray-600'>Diversification Score</span>
                  <span className='text-sm font-bold text-blue-600'>
                    {portfolioMetrics.diversificationScore.toFixed(0)}/100
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-500 h-2 rounded-full'
                    style={{ width: `${portfolioMetrics.diversificationScore}%` }}
                  ></div>
                </div>
              </div>

              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-sm text-gray-600'>Risk Management</span>
                  <span className='text-sm font-bold text-yellow-600'>Moderate</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-yellow-500 h-2 rounded-full'
                    style={{ width: '60%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Quick Actions</h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <Button
            onClick={runPortfolioOptimization}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            Optimize Portfolio
          </Button>

          <Button className='bg-green-600 hover:bg-green-700 text-white'>
            Generate Lineups
          </Button>

          <Button className='bg-purple-600 hover:bg-purple-700 text-white'>
            Rebalance Risk
          </Button>

          <Button className='bg-orange-600 hover:bg-orange-700 text-white'>
            Export Reports
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderLineupsTab = () => (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium text-gray-900'>Lineup Management</h3>
        <div className='flex items-center space-x-2'>
          <Button className='bg-blue-600 hover:bg-blue-700 text-white'>
            + New Lineup
          </Button>
          <Button className='bg-gray-600 hover:bg-gray-700 text-white'>
            Bulk Actions
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Lineup
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Salary
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Projection
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Ownership
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Risk
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  ROI
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {mockLineups.map(lineup => (
                <tr key={lineup.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <input
                      type='checkbox'
                      checked={selectedLineups.includes(lineup.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedLineups([...selectedLineups, lineup.id]);
                        } else {
                          setSelectedLineups(
                            selectedLineups.filter(id => id !== lineup.id)
                          );
                        }
                      }}
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {lineup.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {lineup.contestTypes.map(type => (
                            <Badge
                              key={type}
                              className='mr-1 bg-blue-100 text-blue-800'
                            >
                              {type.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    ${lineup.totalSalary.toLocaleString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {lineup.projectedScore.toFixed(1)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {lineup.projectedOwnership.toFixed(1)}%
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='text-sm text-gray-900'>
                        {lineup.riskScore.toFixed(1)}
                      </div>
                      <div className='ml-2 w-16 bg-gray-200 rounded-full h-1'>
                        <div
                          className={`h-1 rounded-full ${
                            lineup.riskScore < 5
                              ? 'bg-green-500'
                              : lineup.riskScore < 7
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${(lineup.riskScore / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`text-sm font-medium ${
                        lineup.roi > 0.3
                          ? 'text-green-600'
                          : lineup.roi > 0.1
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {(lineup.roi * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <Badge
                      className={`${
                        lineup.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : lineup.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {lineup.status}
                    </Badge>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <div className='flex items-center space-x-2'>
                      <button className='text-blue-600 hover:text-blue-900'>
                        Edit
                      </button>
                      <button className='text-green-600 hover:text-green-900'>
                        Clone
                      </button>
                      <button className='text-red-600 hover:text-red-900'>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderExposureTab = () => (
    <div className='space-y-6'>
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Player Exposure Analysis
        </h3>
        <div className='space-y-4'>
          {/* Mock exposure data */}
          {[
            {
              player: 'Josh Allen',
              position: 'QB',
              exposure: 75,
              limit: 25,
              recommendation: 'Reduce',
            },
            {
              player: 'Christian McCaffrey',
              position: 'RB',
              exposure: 22,
              limit: 25,
              recommendation: 'Optimal',
            },
            {
              player: 'Cooper Kupp',
              position: 'WR',
              exposure: 45,
              limit: 30,
              recommendation: 'Monitor',
            },
            {
              player: 'Travis Kelce',
              position: 'TE',
              exposure: 18,
              limit: 25,
              recommendation: 'Increase',
            },
            {
              player: 'Bills DST',
              position: 'DST',
              exposure: 35,
              limit: 30,
              recommendation: 'Reduce',
            },
          ].map((item, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
            >
              <div className='flex items-center space-x-4'>
                <div>
                  <div className='text-sm font-medium text-gray-900'>{item.player}</div>
                  <div className='text-xs text-gray-500'>{item.position}</div>
                </div>
              </div>

              <div className='flex items-center space-x-4'>
                <div className='w-32'>
                  <div className='flex justify-between text-xs text-gray-600 mb-1'>
                    <span>{item.exposure}%</span>
                    <span>Limit: {item.limit}%</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full ${
                        item.exposure > item.limit
                          ? 'bg-red-500'
                          : item.exposure > item.limit * 0.8
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((item.exposure / item.limit) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <Badge
                  className={`${
                    item.recommendation === 'Reduce'
                      ? 'bg-red-100 text-red-800'
                      : item.recommendation === 'Increase'
                        ? 'bg-blue-100 text-blue-800'
                        : item.recommendation === 'Monitor'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                  }`}
                >
                  {item.recommendation}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className='space-y-6'>
      {portfolioAnalysis && (
        <Card className='p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Portfolio Optimization Results
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 mb-3'>
                Optimal Allocation
              </h4>
              <div className='space-y-2'>
                {Object.entries(portfolioAnalysis.optimalAllocation).map(
                  ([lineup, allocation]) => (
                    <div key={lineup} className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>{lineup}</span>
                      <div className='flex items-center space-x-2'>
                        <span className='text-sm font-medium'>
                          {((allocation as number) * 100).toFixed(0)}%
                        </span>
                        <div className='w-16 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-blue-500 h-2 rounded-full'
                            style={{ width: `${(allocation as number) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-700 mb-3'>
                Performance Metrics
              </h4>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Risk-Adjusted Return</span>
                  <span className='text-sm font-medium text-green-600'>
                    {(portfolioAnalysis.riskAdjustedReturn * 100).toFixed(1)}%
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Max Drawdown</span>
                  <span className='text-sm font-medium text-red-600'>
                    {(portfolioAnalysis.maxDrawdown * 100).toFixed(1)}%
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Sharpe Ratio</span>
                  <span className='text-sm font-medium text-blue-600'>
                    {portfolioAnalysis.sharpeRatio.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-6'>
            <h4 className='text-sm font-medium text-gray-700 mb-3'>Recommendations</h4>
            <div className='space-y-2'>
              {portfolioAnalysis.recommendations.map((rec: string, index: number) => (
                <div key={index} className='flex items-start space-x-2'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full mt-2'></div>
                  <span className='text-sm text-gray-600'>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Performance Analytics
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>{mockLineups.length}</div>
            <div className='text-sm text-gray-600'>Active Lineups</div>
          </div>

          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              ${portfolioMetrics.totalEV.toFixed(0)}
            </div>
            <div className='text-sm text-gray-600'>Total Expected Value</div>
          </div>

          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {portfolioMetrics.diversificationScore.toFixed(0)}%
            </div>
            <div className='text-sm text-gray-600'>Diversification Score</div>
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
              Portfolio Manager Dashboard
            </h2>
            <p className='mt-1 text-sm text-gray-500'>
              Multi-lineup portfolio optimization and risk management
            </p>
          </div>

          <div className='flex items-center space-x-2'>
            <Badge className='bg-blue-100 text-blue-800'>
              {mockLineups.length} Lineups
            </Badge>
            <Badge
              className={`${
                portfolioMetrics.portfolioRisk < 5
                  ? 'bg-green-100 text-green-800'
                  : portfolioMetrics.portfolioRisk < 7
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {portfolioMetrics.portfolioRisk < 5
                ? 'Low Risk'
                : portfolioMetrics.portfolioRisk < 7
                  ? 'Moderate Risk'
                  : 'High Risk'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='flex space-x-8 px-6'>
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'lineups', label: 'Lineups', icon: '📝' },
            { key: 'exposure', label: 'Exposure', icon: '🎯' },
            { key: 'contests', label: 'Contests', icon: '🏆' },
            { key: 'analytics', label: 'Analytics', icon: '📈' },
            { key: 'settings', label: 'Settings', icon: '⚙️' },
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
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'lineups' && renderLineupsTab()}
        {activeTab === 'exposure' && renderExposureTab()}
        {activeTab === 'contests' && (
          <div className='text-center py-12'>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Contest Integration
            </h3>
            <p className='text-gray-600'>Contest management features coming soon...</p>
          </div>
        )}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'settings' && (
          <div className='space-y-6'>
            <Card className='p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Portfolio Settings
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Max Player Exposure (%)
                  </label>
                  <input
                    type='number'
                    value={portfolioSettings.maxExposure}
                    onChange={e =>
                      setPortfolioSettings(prev => ({
                        ...prev,
                        maxExposure: parseInt(e.target.value),
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                    min='1'
                    max='100'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Risk Tolerance
                  </label>
                  <select
                    value={portfolioSettings.riskTolerance}
                    onChange={e =>
                      setPortfolioSettings(prev => ({
                        ...prev,
                        riskTolerance: e.target.value as any,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                  >
                    <option value='conservative'>Conservative</option>
                    <option value='moderate'>Moderate</option>
                    <option value='aggressive'>Aggressive</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Bankroll Percentage (%)
                  </label>
                  <input
                    type='number'
                    value={portfolioSettings.bankrollPercentage}
                    onChange={e =>
                      setPortfolioSettings(prev => ({
                        ...prev,
                        bankrollPercentage: parseInt(e.target.value),
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                    min='1'
                    max='20'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Diversification Target (%)
                  </label>
                  <input
                    type='number'
                    value={portfolioSettings.diversificationTarget}
                    onChange={e =>
                      setPortfolioSettings(prev => ({
                        ...prev,
                        diversificationTarget: parseInt(e.target.value),
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                    min='50'
                    max='100'
                  />
                </div>
              </div>

              <div className='mt-6 space-y-4'>
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={portfolioSettings.autoRebalance}
                    onChange={e =>
                      setPortfolioSettings(prev => ({
                        ...prev,
                        autoRebalance: e.target.checked,
                      }))
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <label className='text-sm font-medium text-gray-700'>
                    Auto-rebalance Portfolio
                  </label>
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={portfolioSettings.kellyCriterion}
                    onChange={e =>
                      setPortfolioSettings(prev => ({
                        ...prev,
                        kellyCriterion: e.target.checked,
                      }))
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <label className='text-sm font-medium text-gray-700'>
                    Use Kelly Criterion for Bet Sizing
                  </label>
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={portfolioSettings.hedgingEnabled}
                    onChange={e =>
                      setPortfolioSettings(prev => ({
                        ...prev,
                        hedgingEnabled: e.target.checked,
                      }))
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <label className='text-sm font-medium text-gray-700'>
                    Enable Portfolio Hedging
                  </label>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
