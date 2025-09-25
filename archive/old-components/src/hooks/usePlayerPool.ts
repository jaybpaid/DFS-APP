import { useQuery } from '@tanstack/react-query';

interface Player {
  player_id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  position: string;
  positions: string[];
  salary: number;
  team_abbreviation: string;
  status: string;
  game_start: string;
  opponent: string;
  is_captain_eligible: boolean;
}

interface PlayerPoolData {
  site: string;
  sport: string;
  slate_id: string;
  draft_group_id: string;
  name: string;
  start_time: string;
  salary_cap: number;
  roster_positions: string[];
  generated_at: string;
  players: Player[];
}

export function usePlayerPool(slateId?: string) {
  return useQuery({
    queryKey: ['player-pool', slateId],
    queryFn: async (): Promise<PlayerPoolData> => {
      if (!slateId) {
        throw new Error('No slate ID provided');
      }

      // Extract draft group ID from slate ID (format: dk_12345)
      const draftGroupId = slateId.replace('dk_', '');

      const response = await fetch(
        `http://localhost:8000/api/slates/${slateId}/players`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch player pool: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    enabled: !!slateId,
    staleTime: 300000, // Consider data fresh for 5 minutes
    refetchInterval: 600000, // Refetch every 10 minutes
  });
}

export function usePlayerPoolStats(slateId?: string) {
  const { data: playerPool, ...query } = usePlayerPool(slateId);

  const stats = playerPool
    ? {
        totalPlayers: playerPool.players.length,
        positions: playerPool.roster_positions,
        salaryCap: playerPool.salary_cap,
        averageSalary: Math.round(
          playerPool.players.reduce((sum, p) => sum + p.salary, 0) /
            playerPool.players.length
        ),
        playersByPosition: playerPool.players.reduce(
          (acc, player) => {
            acc[player.position] = (acc[player.position] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        salaryRange: {
          min: Math.min(...playerPool.players.map(p => p.salary)),
          max: Math.max(...playerPool.players.map(p => p.salary)),
        },
        teams: [...new Set(playerPool.players.map(p => p.team_abbreviation))].length,
      }
    : null;

  return {
    ...query,
    data: playerPool,
    stats,
  };
}
