import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert } from './ui/alert';

interface Contest {
  id: string;
  name: string;
  site: 'draftkings' | 'fanduel' | 'superdraft' | 'yahoo';
  entryFee: number;
  totalEntries: number;
  currentEntries: number;
  maxEntries: number;
  payoutStructure: 'top_heavy' | 'flat' | 'winner_take_all' | 'double_up';
  type: 'gpp' | 'cash' | 'satellite' | 'qualifier';
  sport: string;
  slate: string;
  startTime: string;
  prizePool: number;
  firstPrize: number;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  myEntries: number;
  myLineups: string[];
  liveRank?: number;
  currentPayout?: number;
}

interface WeatherData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  location: string;
  isDome: boolean;
  temperature: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  humidity: number;
  conditions: string;
  impact: 'high' | 'medium' | 'low' | 'none';
  affectedPositions: string[];
  recommendation: string;
  lastUpdated: string;
}

interface ContestTrackerProps {
  contests?: Contest[];
  weather?: WeatherData[];
  onContestUpdate?: (contests: Contest[]) => void;
  liveDataEnabled?: boolean;
}

export default function ContestTracker({
  contests = [],
  weather = [],
  onContestUpdate,
  liveDataEnabled = true,
}: ContestTrackerProps) {
  const [activeTab, setActiveTab] = useState<
    'contests' | 'weather' | 'live' | 'history'
  >('contests');
  const [selectedContests, setSelectedContests] = useState<string[]>([]);
  const [liveTracking, setLiveTracking] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([
    {
      id: 'weather_alert_1',
      type: 'high_wind',
      message: 'High wind conditions detected in KC vs LAR game',
      severity: 'high',
      timestamp: Date.now(),
    },
  ]);

  // Mock contest data
  const mockContests: Contest[] = useMemo(
    () => [
      {
        id: '1',
        name: 'Sunday Million',
        site: 'draftkings',
        entryFee: 25,
        totalEntries: 45000,
        currentEntries: 42300,
        maxEntries: 150,
        payoutStructure: 'top_heavy',
        type: 'gpp',
        sport: 'NFL',
        slate: 'Main',
        startTime: '2025-09-21T17:00:00Z',
        prizePool: 1000000,
        firstPrize: 200000,
        status: 'upcoming',
        myEntries: 3,
        myLineups: ['lineup_1', 'lineup_2', 'lineup_3'],
        liveRank: 1250,
        currentPayout: 0,
      },
      {
        id: '2',
        name: 'Double Up',
        site: 'draftkings',
        entryFee: 10,
        totalEntries: 2000,
        currentEntries: 1850,
        maxEntries: 1,
        payoutStructure: 'double_up',
        type: 'cash',
        sport: 'NFL',
        slate: 'Main',
        startTime: '2025-09-21T17:00:00Z',
        prizePool: 18500,
        firstPrize: 20,
        status: 'upcoming',
        myEntries: 1,
        myLineups: ['lineup_4'],
        liveRank: 892,
        currentPayout: 0,
      },
      {
        id: '3',
        name: 'Playoff Qualifier',
        site: 'fanduel',
        entryFee: 50,
        totalEntries: 500,
        currentEntries: 450,
        maxEntries: 3,
        payoutStructure: 'winner_take_all',
        type: 'satellite',
        sport: 'NFL',
        slate: 'Main',
        startTime: '2025-09-21T17:00:00Z',
        prizePool: 22500,
        firstPrize: 5000,
        status: 'live',
        myEntries: 2,
        myLineups: ['lineup_5', 'lineup_6'],
        liveRank: 23,
        currentPayout: 250,
      },
    ],
    []
  );

  // Mock weather data
  const mockWeather: WeatherData[] = useMemo(
    () => [
      {
        gameId: 'BUF_MIA',
        homeTeam: 'MIA',
        awayTeam: 'BUF',
        location: 'Miami, FL',
        isDome: false,
        temperature: 84,
        windSpeed: 8,
        windDirection: 'SE',
        precipitation: 15,
        humidity: 78,
        conditions: 'Partly Cloudy, Chance of Rain',
        impact: 'medium',
        affectedPositions: ['WR', 'QB'],
        recommendation: 'Monitor passing games closely due to potential rain',
        lastUpdated: '2025-09-21T15:30:00Z',
      },
      {
        gameId: 'GB_DET',
        homeTeam: 'DET',
        awayTeam: 'GB',
        location: 'Detroit, MI',
        isDome: true,
        temperature: 72,
        windSpeed: 0,
        windDirection: 'None',
        precipitation: 0,
        humidity: 45,
        conditions: 'Dome - Perfect Conditions',
        impact: 'none',
        affectedPositions: [],
        recommendation: 'Optimal conditions for all positions',
        lastUpdated: '2025-09-21T15:30:00Z',
      },
      {
        gameId: 'KC_LAR',
        homeTeam: 'LAR',
        awayTeam: 'KC',
        location: 'Los Angeles, CA',
        isDome: false,
        temperature: 76,
        windSpeed: 22,
        windDirection: 'W',
        precipitation: 0,
        humidity: 52,
        conditions: 'Sunny, Very Windy',
        impact: 'high',
        affectedPositions: ['QB', 'WR', 'TE', 'K'],
        recommendation: 'Avoid passing games, favor rushing attacks and unders',
        lastUpdated: '2025-09-21T15:30:00Z',
      },
    ],
    []
  );

  const contestMetrics = useMemo(() => {
    const totalExposure = mockContests.reduce(
      (sum, contest) => sum + contest.entryFee * contest.myEntries,
      0
    );
    const potentialWinnings = mockContests.reduce(
      (sum, contest) => sum + (contest.currentPayout || 0),
      0
    );
    const activeContests = mockContests.filter(
      c => c.status === 'live' || c.status === 'upcoming'
    ).length;

    return {
      totalExposure,
      potentialWinnings,
      activeContests,
      totalEntries: mockContests.reduce((sum, contest) => sum + contest.myEntries, 0),
    };
  }, [mockContests]);

  const weatherImpactSummary = useMemo(() => {
    const highImpactGames = mockWeather.filter(w => w.impact === 'high').length;
    const mediumImpactGames = mockWeather.filter(w => w.impact === 'medium').length;
    const domeGames = mockWeather.filter(w => w.isDome).length;
    const windyGames = mockWeather.filter(w => w.windSpeed > 15).length;
    const rainGames = mockWeather.filter(w => w.precipitation > 10).length;

    return {
      highImpactGames,
      mediumImpactGames,
      domeGames,
      windyGames,
      rainGames,
      totalGames: mockWeather.length,
    };
  }, [mockWeather]);

  const getContestStatusColor = (status: Contest['status']) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWeatherImpactColor = (impact: WeatherData['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'none':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContestsTab = () => (
    <div className='space-y-6'>
      {/* Contest Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card className='p-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {contestMetrics.activeContests}
            </div>
            <div className='text-sm text-gray-600'>Active Contests</div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              ${contestMetrics.totalExposure}
            </div>
            <div className='text-sm text-gray-600'>Total Exposure</div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {contestMetrics.totalEntries}
            </div>
            <div className='text-sm text-gray-600'>Total Entries</div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              ${contestMetrics.potentialWinnings}
            </div>
            <div className='text-sm text-gray-600'>Live Winnings</div>
          </div>
        </Card>
      </div>

      {/* Contest Table */}
      <Card className='overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium text-gray-900'>Contest Management</h3>
            <div className='flex items-center space-x-2'>
              {liveDataEnabled && (
                <div className='flex items-center space-x-2 text-sm'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='text-green-700'>Live Tracking</span>
                </div>
              )}
              <Button className='bg-blue-600 hover:bg-blue-700 text-white text-sm'>
                + Enter Contest
              </Button>
            </div>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Contest
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Entry Fee
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Entries
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  My Entries
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Live Rank
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Payout
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
              {mockContests.map(contest => (
                <tr key={contest.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {contest.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {contest.site.toUpperCase()} • {contest.type.toUpperCase()}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    ${contest.entryFee}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {contest.currentEntries.toLocaleString()} /{' '}
                    {contest.totalEntries.toLocaleString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-sm font-medium text-gray-900'>
                        {contest.myEntries}
                      </span>
                      <span className='text-xs text-gray-500'>
                        / {contest.maxEntries} max
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {contest.liveRank ? (
                      <div className='text-sm'>
                        <div className='font-medium text-gray-900'>
                          #{contest.liveRank.toLocaleString()}
                        </div>
                        <div className='text-xs text-gray-500'>
                          Top{' '}
                          {((contest.liveRank / contest.currentEntries) * 100).toFixed(
                            1
                          )}
                          %
                        </div>
                      </div>
                    ) : (
                      <span className='text-sm text-gray-400'>-</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {contest.currentPayout ? (
                      <span className='text-sm font-medium text-green-600'>
                        ${contest.currentPayout.toFixed(2)}
                      </span>
                    ) : (
                      <span className='text-sm text-gray-400'>$0.00</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <Badge className={getContestStatusColor(contest.status)}>
                      {contest.status}
                    </Badge>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <div className='flex items-center space-x-2'>
                      <button className='text-blue-600 hover:text-blue-900'>
                        View
                      </button>
                      <button className='text-green-600 hover:text-green-900'>
                        Edit
                      </button>
                      {contest.status === 'upcoming' && (
                        <button className='text-red-600 hover:text-red-900'>
                          Withdraw
                        </button>
                      )}
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

  const renderWeatherTab = () => (
    <div className='space-y-6'>
      {/* Weather Impact Overview */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
        <Card className='p-4 text-center'>
          <div className='text-lg font-bold text-red-600'>
            {weatherImpactSummary.highImpactGames}
          </div>
          <div className='text-xs text-gray-600'>High Impact Games</div>
        </Card>

        <Card className='p-4 text-center'>
          <div className='text-lg font-bold text-yellow-600'>
            {weatherImpactSummary.mediumImpactGames}
          </div>
          <div className='text-xs text-gray-600'>Medium Impact</div>
        </Card>

        <Card className='p-4 text-center'>
          <div className='text-lg font-bold text-green-600'>
            {weatherImpactSummary.domeGames}
          </div>
          <div className='text-xs text-gray-600'>Dome Games</div>
        </Card>

        <Card className='p-4 text-center'>
          <div className='text-lg font-bold text-blue-600'>
            {weatherImpactSummary.windyGames}
          </div>
          <div className='text-xs text-gray-600'>Windy Games (15+ mph)</div>
        </Card>

        <Card className='p-4 text-center'>
          <div className='text-lg font-bold text-purple-600'>
            {weatherImpactSummary.rainGames}
          </div>
          <div className='text-xs text-gray-600'>Rain Expected</div>
        </Card>
      </div>

      {/* weather_alerts Weather Alerts System */}
      {mockWeather.filter(w => w.impact === 'high' || w.impact === 'medium').length >
        0 && (
        <Alert className='border-yellow-200 bg-yellow-50'>
          <div className='flex items-start space-x-3'>
            <span className='text-yellow-600 text-xl'>🌦️</span>
            <div>
              <h4 className='text-yellow-800 font-medium'>Weather Alerts Active</h4>
              <p className='text-yellow-700 text-sm mt-1'>
                {mockWeather.filter(w => w.impact === 'high').length} high_impact and{' '}
                {mockWeather.filter(w => w.impact === 'medium').length} medium-impact
                weather conditions detected. Review game-specific recommendations below.
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* Weather Details */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {mockWeather.map(weather => (
          <Card key={weather.gameId} className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h3 className='text-lg font-medium text-gray-900'>
                  {weather.awayTeam} @ {weather.homeTeam}
                </h3>
                <p className='text-sm text-gray-500'>{weather.location}</p>
              </div>
              <Badge className={getWeatherImpactColor(weather.impact)}>
                {weather.impact.toUpperCase()} IMPACT
              </Badge>
            </div>

            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Temperature:</span>
                  <span className='font-medium'>{weather.temperature}°F</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Wind:</span>
                  <span className='font-medium'>
                    {weather.windSpeed} mph {weather.windDirection}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Precipitation:</span>
                  <span className='font-medium'>{weather.precipitation}%</span>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Humidity:</span>
                  <span className='font-medium'>{weather.humidity}%</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Venue:</span>
                  <span className='font-medium'>
                    {weather.isDome ? 'Dome' : 'Outdoor'}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Conditions:</span>
                  <span className='font-medium text-xs'>{weather.conditions}</span>
                </div>
              </div>
            </div>

            {weather.affectedPositions.length > 0 && (
              <div className='mb-4'>
                <div className='text-sm text-gray-600 mb-2'>Affected Positions:</div>
                <div className='flex flex-wrap gap-1'>
                  {weather.affectedPositions.map(pos => (
                    <Badge key={pos} className='bg-red-100 text-red-800 text-xs'>
                      {pos}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className='p-3 bg-gray-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Recommendation:</div>
              <div className='text-sm text-gray-900'>{weather.recommendation}</div>
            </div>

            <div className='mt-3 text-xs text-gray-500'>
              Last updated: {new Date(weather.lastUpdated).toLocaleTimeString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLiveTab = () => (
    <div className='space-y-6'>
      {/* Live Contest Tracking */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>Live Contest Tracking</h3>
          <div className='flex items-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full ${liveTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
            ></div>
            <span className='text-sm text-gray-600'>
              {liveTracking ? 'Live Updates' : 'Paused'}
            </span>
            <Button
              onClick={() => setLiveTracking(!liveTracking)}
              className='text-xs px-2 py-1'
            >
              {liveTracking ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {mockContests
            .filter(c => c.status === 'live')
            .map(contest => (
              <div key={contest.id} className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='font-medium text-gray-900'>{contest.name}</h4>
                  <Badge className='bg-green-100 text-green-800'>LIVE</Badge>
                </div>

                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Current Rank:</span>
                    <span className='font-medium'>
                      #{contest.liveRank?.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Percentile:</span>
                    <span className='font-medium'>
                      {contest.liveRank
                        ? ((contest.liveRank / contest.currentEntries) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Current Payout:</span>
                    <span
                      className={`font-medium ${contest.currentPayout ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      ${contest.currentPayout?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>ROI:</span>
                    <span
                      className={`font-medium ${
                        contest.currentPayout &&
                        contest.currentPayout > contest.entryFee * contest.myEntries
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {contest.currentPayout
                        ? (
                            ((contest.currentPayout -
                              contest.entryFee * contest.myEntries) /
                              (contest.entryFee * contest.myEntries)) *
                            100
                          ).toFixed(1)
                        : '-100.0'}
                      %
                    </span>
                  </div>
                </div>

                <div className='mt-4'>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full ${
                        contest.liveRank &&
                        contest.liveRank <= contest.currentEntries * 0.1
                          ? 'bg-green-500'
                          : contest.liveRank &&
                              contest.liveRank <= contest.currentEntries * 0.5
                            ? 'bg-blue-500'
                            : 'bg-red-500'
                      }`}
                      style={{
                        width: contest.liveRank
                          ? `${Math.max(5, 100 - (contest.liveRank / contest.currentEntries) * 100)}%`
                          : '0%',
                      }}
                    ></div>
                  </div>
                  <div className='text-xs text-gray-500 mt-1'>
                    Performance relative to field
                  </div>
                </div>
              </div>
            ))}
        </div>

        {mockContests.filter(c => c.status === 'live').length === 0 && (
          <div className='text-center py-12'>
            <span className='text-gray-500'>No live contests currently</span>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-medium text-gray-900'>
              Contest Tracker & Weather Impact
            </h2>
            <p className='mt-1 text-sm text-gray-500'>
              Live contest tracking with integrated weather analysis and impact
              assessment
            </p>
          </div>

          <div className='flex items-center space-x-2'>
            <Badge className='bg-blue-100 text-blue-800'>
              {contestMetrics.activeContests} Active
            </Badge>
            <Badge
              className={`${
                weatherImpactSummary.highImpactGames > 0
                  ? 'bg-red-100 text-red-800'
                  : weatherImpactSummary.mediumImpactGames > 0
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }`}
            >
              Weather:{' '}
              {weatherImpactSummary.highImpactGames > 0
                ? 'High Impact'
                : weatherImpactSummary.mediumImpactGames > 0
                  ? 'Medium Impact'
                  : 'Clear'}
            </Badge>
            {liveDataEnabled && (
              <Badge className='bg-green-100 text-green-800'>Live Data</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='flex space-x-8 px-6'>
          {[
            { key: 'contests', label: 'Contest Management', icon: '🏆' },
            { key: 'weather', label: 'Weather Impact', icon: '🌦️' },
            { key: 'live', label: 'Live Tracking', icon: '📈' },
            { key: 'history', label: 'Contest History', icon: '📊' },
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
        {activeTab === 'contests' && renderContestsTab()}
        {activeTab === 'weather' && renderWeatherTab()}
        {activeTab === 'live' && renderLiveTab()}
        {activeTab === 'history' && (
          <div className='text-center py-12'>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Contest History</h3>
            <p className='text-gray-600'>
              Historical contest performance analytics coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
