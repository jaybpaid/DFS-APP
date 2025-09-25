/**
 * Enhanced Player Pool Table with Weather Impact Chips
 * Displays players with weather impact indicators and game filtering
 */

import React, { useMemo } from 'react';
import { Player, DraftKingsPlayer } from '../types';
import { useDfsStore } from '../store/dfs-store';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Home,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface WeatherImpactChipProps {
  gameId: string;
  playerTeam: string;
  weatherData: any[];
  className?: string;
}

const WeatherImpactChip: React.FC<WeatherImpactChipProps> = ({
  gameId,
  playerTeam,
  weatherData,
  className = '',
}) => {
  const weatherInfo = useMemo(() => {
    // Find weather for this player's game
    const weather = weatherData.find(w => {
      const [away, home] = w.gameId?.split('@') || [];
      return playerTeam === away || playerTeam === home;
    });

    if (!weather) return null;

    // Determine impact color and icon
    let impactColor = 'bg-gray-100 text-gray-600';
    let impactIcon = <Minus className='w-3 h-3' />;
    let impactText = 'No Impact';

    if (weather.isDome) {
      impactColor = 'bg-green-100 text-green-700';
      impactIcon = <Home className='w-3 h-3' />;
      impactText = 'Dome';
    } else {
      switch (weather.impact) {
        case 'MINOR':
          impactColor = 'bg-yellow-100 text-yellow-700';
          impactIcon = <TrendingDown className='w-3 h-3' />;
          impactText = 'Minor';
          break;
        case 'MODERATE':
          impactColor = 'bg-orange-100 text-orange-700';
          impactIcon = <Wind className='w-3 h-3' />;
          impactText = 'Moderate';
          break;
        case 'MAJOR':
          impactColor = 'bg-red-100 text-red-700';
          impactIcon = <CloudRain className='w-3 h-3' />;
          impactText = 'Major';
          break;
        default:
          if (weather.windMph >= 10) {
            impactColor = 'bg-blue-100 text-blue-700';
            impactIcon = <Wind className='w-3 h-3' />;
            impactText = `${weather.windMph}mph`;
          }
      }
    }

    return {
      ...weather,
      impactColor,
      impactIcon,
      impactText,
    };
  }, [gameId, playerTeam, weatherData]);

  if (!weatherInfo) return null;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${weatherInfo.impactColor} ${className}`}
      title={`${weatherInfo.summary} - ${weatherInfo.tempF}°F, ${weatherInfo.windMph}mph wind`}
    >
      {weatherInfo.impactIcon}
      <span>{weatherInfo.impactText}</span>
    </div>
  );
};

interface EnhancedPlayerPoolTableWithWeatherProps {
  players: (Player | DraftKingsPlayer)[];
  isLoading?: boolean;
  showWeatherImpact?: boolean;
}

export const EnhancedPlayerPoolTableWithWeather: React.FC<
  EnhancedPlayerPoolTableWithWeatherProps
> = ({ players, isLoading = false, showWeatherImpact = true }) => {
  const { weatherData, activeGameIds } = useDfsStore();

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      // Sort by salary descending
      const salaryA = 'salary' in a ? a.salary : 0;
      const salaryB = 'salary' in b ? b.salary : 0;
      return salaryB - salaryA;
    });
  }, [players]);

  if (isLoading) {
    return (
      <div className='animate-pulse'>
        <div className='space-y-3'>
          {[...Array(10)].map((_, i) => (
            <div key={i} className='flex space-x-4'>
              <div className='h-4 bg-gray-200 rounded w-1/4'></div>
              <div className='h-4 bg-gray-200 rounded w-1/6'></div>
              <div className='h-4 bg-gray-200 rounded w-1/6'></div>
              <div className='h-4 bg-gray-200 rounded w-1/6'></div>
              <div className='h-4 bg-gray-200 rounded w-1/6'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-500'>
          {activeGameIds.size > 0
            ? 'No players found for selected games'
            : 'No players available'}
        </p>
        {activeGameIds.size > 0 && (
          <p className='text-sm text-gray-400 mt-2'>
            Try selecting different games or clearing filters
          </p>
        )}
      </div>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Player
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Position
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Team
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Salary
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Projected
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Value
            </th>
            {showWeatherImpact && (
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Weather
              </th>
            )}
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Ownership
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {sortedPlayers.map((player, index) => {
            const name =
              'name' in player
                ? player.name
                : 'first_name' in player
                  ? `${player.first_name} ${player.last_name}`
                  : 'Unknown';
            const position =
              'position' in player
                ? player.position
                : 'roster_position' in player
                  ? player.roster_position
                  : 'N/A';
            const team =
              'team_abbreviation' in player
                ? player.team_abbreviation
                : 'team' in player
                  ? player.team
                  : 'N/A';
            const salary = 'salary' in player ? player.salary : 0;
            const projected =
              'projectedPoints' in player
                ? player.projectedPoints
                : 'projected_points' in player
                  ? player.projected_points
                  : 0;
            const ownership =
              'ownership' in player
                ? player.ownership
                : 'projected_ownership' in player
                  ? player.projected_ownership
                  : 0;

            const value =
              salary > 0 ? (projected / (salary / 1000)).toFixed(2) : '0.00';

            return (
              <tr key={index} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>{name}</div>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    {position}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {team}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  ${salary.toLocaleString()}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {projected.toFixed(1)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {value}
                </td>
                {showWeatherImpact && (
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <WeatherImpactChip
                      gameId={`${team}@OPPONENT`} // This would need proper game mapping
                      playerTeam={team}
                      weatherData={weatherData}
                    />
                  </td>
                )}
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {(ownership * 100).toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Footer */}
      <div className='bg-gray-50 px-6 py-3 border-t border-gray-200'>
        <div className='flex justify-between items-center text-sm text-gray-600'>
          <span>
            Showing {players.length} player{players.length === 1 ? '' : 's'}
            {activeGameIds.size > 0 &&
              ` from ${activeGameIds.size} selected game${activeGameIds.size === 1 ? '' : 's'}`}
          </span>
          <span>
            Total Salary: $
            {sortedPlayers
              .reduce((sum, p) => sum + ('salary' in p ? p.salary : 0), 0)
              .toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPlayerPoolTableWithWeather;
