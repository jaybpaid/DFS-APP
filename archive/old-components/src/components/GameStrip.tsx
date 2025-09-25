/**
 * Game Strip Component
 * Horizontal scrollable strip showing games with weather, lines, and filtering
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Home,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

interface TeamTotals {
  away: number;
  home: number;
}

interface Venue {
  stadium: string;
  roof: 'OPEN' | 'DOME' | 'RETRACTABLE_OPEN' | 'RETRACTABLE_CLOSED';
  city: string;
  tz: string;
}

interface Game {
  gameId: string;
  away: string;
  home: string;
  kickoff: string;
  spread: number;
  total: number;
  teamTotals: TeamTotals;
  venue: Venue;
  weatherIcon?: string;
  weatherSummary?: string;
  pace?: {
    expectedPlays: number;
    paceRank: number;
  };
}

interface WeatherData {
  gameId: string;
  tempF: number;
  windMph: number;
  precip: number;
  impact: 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR';
  summary: string;
  isDome: boolean;
}

interface GameStripProps {
  games: Game[];
  weather: WeatherData[];
  onToggleGame: (gameId: string) => void;
  activeGameIds: Set<string>;
  loading?: boolean;
  onRefresh?: () => void;
  asOf?: string;
  provenance?: string[];
}

const WEATHER_ICONS = {
  dome: Home,
  wind_strong: Wind,
  rain_heavy: CloudRain,
  rain: CloudRain,
  cold: CloudSnow,
  clear: Sun,
  default: Cloud,
};

const TEAM_LOGOS: Record<string, string> = {
  // NFL team logo mappings (simplified for demo)
  PHI: '🦅',
  DAL: '⭐',
  KC: '🏈',
  BUF: '🦬',
  SF: '🏔️',
  BAL: '🐦',
  CIN: '🐅',
  LAR: '🐏',
  TB: '🏴‍☠️',
  GB: '🧀',
  NE: '🇺🇸',
  PIT: '⚫',
  SEA: '🌊',
  DEN: '🐴',
  MIA: '🐬',
  NYG: '🗽',
  WAS: '🦅',
  MIN: '⚡',
  DET: '🦁',
  CHI: '🐻',
  ATL: '🦅',
  NO: '⚜️',
  CAR: '🐾',
  ARI: '🏜️',
  LAC: '⚡',
  LV: '🏴‍☠️',
  IND: '🐎',
  TEN: '⚔️',
  JAX: '🐆',
  HOU: '🤠',
  CLE: '🟤',
  NYJ: '✈️',
};

export const GameStrip: React.FC<GameStripProps> = ({
  games,
  weather,
  onToggleGame,
  activeGameIds,
  loading = false,
  onRefresh,
  asOf,
  provenance = [],
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

  // Create weather lookup
  const weatherByGame = React.useMemo(() => {
    const lookup: Record<string, WeatherData> = {};
    weather.forEach(w => {
      lookup[w.gameId] = w;
    });
    return lookup;
  }, [weather]);

  // Sort games by kickoff time
  const sortedGames = React.useMemo(() => {
    return [...games].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
  }, [games]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - scrollRef.current.offsetLeft,
      scrollLeft: scrollRef.current.scrollLeft,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2;
    scrollRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getWeatherIcon = (gameId: string) => {
    const gameWeather = weatherByGame[gameId];
    if (!gameWeather) return WEATHER_ICONS.default;

    const iconKey = games.find(g => g.gameId === gameId)?.weatherIcon || 'default';
    return (
      WEATHER_ICONS[iconKey as keyof typeof WEATHER_ICONS] || WEATHER_ICONS.default
    );
  };

  const formatSpread = (spread: number, homeTeam: string) => {
    if (spread === 0) return 'PK';
    if (spread > 0) return `${homeTeam} +${spread}`;
    return `${homeTeam} ${spread}`;
  };

  const formatKickoffTime = (kickoff: string, timezone: string) => {
    const kickoffDate = new Date(kickoff);
    const localTime = format(kickoffDate, 'h:mm a');
    const etTime = formatInTimeZone(kickoffDate, 'America/New_York', 'h:mm a z');
    return { localTime, etTime };
  };

  const getPaceIndicator = (pace?: { expectedPlays: number; paceRank: number }) => {
    if (!pace) return null;

    const paceLevel =
      pace.paceRank <= 10 ? 'fast' : pace.paceRank <= 22 ? 'medium' : 'slow';
    const colors = {
      fast: 'bg-green-500',
      medium: 'bg-yellow-500',
      slow: 'bg-red-500',
    };

    return (
      <div className='flex items-center gap-1'>
        <div className={`w-2 h-1 rounded ${colors[paceLevel]}`} />
        <span className='text-xs text-gray-500'>{pace.expectedPlays}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className='w-full bg-white border-b shadow-sm'>
        <div className='flex items-center justify-center py-4'>
          <RefreshCw className='h-4 w-4 animate-spin mr-2' />
          <span className='text-sm text-gray-600'>Loading games...</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='w-full bg-white border-b shadow-sm sticky top-0 z-40'>
        {/* Header */}
        <div className='flex items-center justify-between px-4 py-2 border-b border-gray-100'>
          <div className='flex items-center gap-4'>
            <h3 className='font-semibold text-gray-900'>Games</h3>
            {activeGameIds.size > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => activeGameIds.forEach(id => onToggleGame(id))}
                className='h-6 px-2 text-xs'
              >
                <X className='h-3 w-3 mr-1' />
                Clear filters ({activeGameIds.size})
              </Button>
            )}
          </div>

          <div className='flex items-center gap-2 text-xs text-gray-500'>
            {asOf && <span>Updated {format(new Date(asOf), 'h:mm a')}</span>}
            {onRefresh && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onRefresh}
                className='h-6 w-6 p-0'
              >
                <RefreshCw className='h-3 w-3' />
              </Button>
            )}
          </div>
        </div>

        {/* Game Strip */}
        <div
          ref={scrollRef}
          className='flex gap-3 p-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing'
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {sortedGames.map(game => {
            const isActive = activeGameIds.has(game.gameId);
            const gameWeather = weatherByGame[game.gameId];
            const WeatherIcon = getWeatherIcon(game.gameId);
            const times = formatKickoffTime(game.kickoff, game.venue.tz);

            return (
              <Card
                key={game.gameId}
                className={`flex-shrink-0 w-48 p-3 cursor-pointer transition-all duration-200 select-none ${
                  isActive
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-md hover:bg-gray-50'
                }`}
                onClick={() => onToggleGame(game.gameId)}
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Teams */}
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-sm'>{game.away}</span>
                    <span className='text-lg'>{TEAM_LOGOS[game.away] || '🏈'}</span>
                  </div>
                  <span className='text-xs text-gray-500'>@</span>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-sm'>{game.home}</span>
                    <span className='text-lg'>{TEAM_LOGOS[game.home] || '🏈'}</span>
                  </div>
                </div>

                {/* Kickoff Time */}
                <div className='flex items-center justify-center mb-2'>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className='flex items-center gap-1 text-xs text-gray-600'>
                        <Clock className='h-3 w-3' />
                        {times.localTime}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className='text-xs'>
                        <div>Local: {times.localTime}</div>
                        <div>ET: {times.etTime}</div>
                        <div>Stadium: {game.venue.stadium}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Spread & Total */}
                <div className='flex items-center justify-between mb-2 text-xs'>
                  <div className='text-center'>
                    <div className='text-gray-500'>Spread</div>
                    <div className='font-medium'>
                      {formatSpread(game.spread, game.home)}
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-gray-500'>Total</div>
                    <div className='font-medium'>{game.total}</div>
                  </div>
                </div>

                {/* Team Totals */}
                <div className='flex items-center justify-between mb-2 text-xs'>
                  <div className='text-center'>
                    <div className='text-gray-500'>{game.away}</div>
                    <div className='font-medium'>{game.teamTotals.away}</div>
                  </div>
                  <div className='text-gray-400'>|</div>
                  <div className='text-center'>
                    <div className='text-gray-500'>{game.home}</div>
                    <div className='font-medium'>{game.teamTotals.home}</div>
                  </div>
                </div>

                {/* Weather & Pace */}
                <div className='flex items-center justify-between'>
                  {/* Weather */}
                  <Tooltip>
                    <TooltipTrigger>
                      <div className='flex items-center gap-1'>
                        <WeatherIcon className='h-4 w-4 text-gray-600' />
                        <span className='text-xs text-gray-600'>
                          {gameWeather?.isDome
                            ? 'Dome'
                            : gameWeather?.summary || 'Clear'}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className='text-xs max-w-48'>
                        {gameWeather ? (
                          <div>
                            <div className='font-medium mb-1'>
                              {gameWeather.summary}
                            </div>
                            <div>Temp: {gameWeather.tempF}°F</div>
                            <div>Wind: {gameWeather.windMph} mph</div>
                            <div>Precip: {(gameWeather.precip * 100).toFixed(0)}%</div>
                            <div>Impact: {gameWeather.impact}</div>
                            {asOf && (
                              <div className='mt-1 pt-1 border-t border-gray-200'>
                                As of: {format(new Date(asOf), 'h:mm a')}
                              </div>
                            )}
                            {provenance.length > 0 && (
                              <div className='mt-1 text-gray-400'>
                                Sources: {provenance.join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>No weather data available</div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Pace Indicator */}
                  {game.pace && (
                    <Tooltip>
                      <TooltipTrigger>{getPaceIndicator(game.pace)}</TooltipTrigger>
                      <TooltipContent>
                        <div className='text-xs'>
                          <div>Expected Plays: {game.pace.expectedPlays}</div>
                          <div>Pace Rank: #{game.pace.paceRank}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className='absolute top-2 right-2'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full' />
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedGames.length === 0 && (
          <div className='flex items-center justify-center py-8 text-gray-500'>
            <div className='text-center'>
              <div className='text-sm'>No games available</div>
              <div className='text-xs mt-1'>Check your slate selection</div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default GameStrip;
