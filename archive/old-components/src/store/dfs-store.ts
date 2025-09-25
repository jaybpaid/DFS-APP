import { create } from 'zustand';
import { SlateSelection } from '../components/DateSlateSelector';
import { getTodayISO } from '../utils/time-helpers';
import { DraftKingsPlayer } from '../types';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPoints: number;
  ownership: number;
}

interface Slate {
  id: string;
  name: string;
  sport: string;
  site: string;
  startTime: string;
  playerCount: number;
  salaryCap: number;
  isLive: boolean;
}

interface Lineup {
  id: string;
  players: Player[];
  totalSalary: number;
  projectedPoints: number;
  exposure: number;
}

interface SlatePlayerCache {
  players: (Player | DraftKingsPlayer)[];
  lastFetched: number;
  isLoading: boolean;
  error: string | null;
}

interface DfsStore {
  // State
  currentSlate: Slate | null;
  selectedSlateId: string | null;
  players: Player[]; // Deprecated - use playersBySlate
  playersBySlate: { [slateId: string]: SlatePlayerCache };
  optimizedLineups: Lineup[];
  isOptimizing: boolean;
  isSimulating: boolean;
  slateSelection: SlateSelection | null;

  // Game Strip State
  activeGameIds: Set<string>;
  gamesData: any[];
  weatherData: any[];
  gamesLoading: boolean;

  // Actions
  setCurrentSlate: (slate: Slate | null) => void;
  setSelectedSlateId: (slateId: string | null) => void;
  setPlayers: (players: Player[]) => void; // Deprecated
  setOptimizedLineups: (lineups: Lineup[]) => void;
  setIsOptimizing: (isOptimizing: boolean) => void;
  setIsSimulating: (isSimulating: boolean) => void;
  setSlateSelection: (selection: SlateSelection) => void;
  fetchPlayersForSlate: (slateId: string) => Promise<void>;
  getPlayersForSlate: (slateId: string) => (Player | DraftKingsPlayer)[];
  isSlateLoading: (slateId: string) => boolean;
  getSlateError: (slateId: string) => string | null;

  // Game Strip Actions
  toggleGameFilter: (gameId: string) => void;
  clearGameFilters: () => void;
  fetchGamesData: (slateId: string) => Promise<void>;
  getFilteredPlayers: (slateId: string) => (Player | DraftKingsPlayer)[];

  reset: () => void;
}

export const useDfsStore = create<DfsStore>((set, get) => ({
  // Initial state
  currentSlate: null,
  selectedSlateId: null,
  players: [],
  playersBySlate: {},
  optimizedLineups: [],
  isOptimizing: false,
  isSimulating: false,
  slateSelection: {
    date: getTodayISO(),
    sport: 'NFL',
    site: 'DK',
  },

  // Game Strip Initial State
  activeGameIds: new Set<string>(),
  gamesData: [],
  weatherData: [],
  gamesLoading: false,

  // Actions
  setCurrentSlate: slate => set({ currentSlate: slate }),
  setSelectedSlateId: slateId => set({ selectedSlateId: slateId }),
  setPlayers: players => set({ players }),
  setOptimizedLineups: lineups => set({ optimizedLineups: lineups }),
  setIsOptimizing: isOptimizing => set({ isOptimizing }),
  setIsSimulating: isSimulating => set({ isSimulating }),
  setSlateSelection: selection => set({ slateSelection: selection }),

  // Slate-aware player fetching
  fetchPlayersForSlate: async (slateId: string) => {
    const { playersBySlate } = get();

    // Set loading state
    set({
      playersBySlate: {
        ...playersBySlate,
        [slateId]: {
          players: playersBySlate[slateId]?.players || [],
          lastFetched: playersBySlate[slateId]?.lastFetched || 0,
          isLoading: true,
          error: null,
        },
      },
    });

    try {
      // Use Python FastAPI backend on port 8000
      const response = await fetch(
        `http://localhost:8000/api/slates/${slateId}/players`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.statusText}`);
      }

      const data = await response.json();
      const players = data.players; // Extract players array from response

      // Update cache with fetched players
      set({
        playersBySlate: {
          ...get().playersBySlate,
          [slateId]: {
            players,
            lastFetched: Date.now(),
            isLoading: false,
            error: null,
          },
        },
      });
    } catch (error) {
      // Set error state
      set({
        playersBySlate: {
          ...get().playersBySlate,
          [slateId]: {
            players: playersBySlate[slateId]?.players || [],
            lastFetched: playersBySlate[slateId]?.lastFetched || 0,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      });
    }
  },

  // Helper functions
  getPlayersForSlate: (slateId: string) => {
    const { playersBySlate } = get();
    return playersBySlate[slateId]?.players || [];
  },

  isSlateLoading: (slateId: string) => {
    const { playersBySlate } = get();
    return playersBySlate[slateId]?.isLoading || false;
  },

  getSlateError: (slateId: string) => {
    const { playersBySlate } = get();
    return playersBySlate[slateId]?.error || null;
  },

  // Game Strip Actions
  toggleGameFilter: (gameId: string) => {
    const { activeGameIds } = get();
    const newActiveGameIds = new Set(activeGameIds);

    if (newActiveGameIds.has(gameId)) {
      newActiveGameIds.delete(gameId);
    } else {
      newActiveGameIds.add(gameId);
    }

    set({ activeGameIds: newActiveGameIds });

    // Save to session storage
    sessionStorage.setItem('dfs-active-games', JSON.stringify([...newActiveGameIds]));
  },

  clearGameFilters: () => {
    set({ activeGameIds: new Set<string>() });
    sessionStorage.removeItem('dfs-active-games');
  },

  fetchGamesData: async (slateId: string) => {
    set({ gamesLoading: true });

    try {
      // Fetch games and weather data from Python API
      const [gamesResponse, weatherResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/games/${slateId}`),
        fetch(`http://localhost:8000/api/weather/${slateId}`),
      ]);

      if (!gamesResponse.ok || !weatherResponse.ok) {
        throw new Error('Failed to fetch games or weather data');
      }

      const gamesData = await gamesResponse.json();
      const weatherData = await weatherResponse.json();

      set({
        gamesData: gamesData.games || [],
        weatherData: weatherData.byGame || [],
        gamesLoading: false,
      });

      // Load saved game filters from session storage
      const savedFilters = sessionStorage.getItem('dfs-active-games');
      if (savedFilters) {
        const gameIds = JSON.parse(savedFilters);
        set({ activeGameIds: new Set(gameIds) });
      }
    } catch (error) {
      console.error('Error fetching games data:', error);
      set({ gamesLoading: false });
    }
  },

  getFilteredPlayers: (slateId: string) => {
    const { playersBySlate, activeGameIds } = get();
    const allPlayers = playersBySlate[slateId]?.players || [];

    // If no games are selected, return all players
    if (activeGameIds.size === 0) {
      return allPlayers;
    }

    // Filter players by selected games
    return allPlayers.filter(player => {
      // Extract game info from player data
      const playerTeam =
        'team_abbreviation' in player
          ? player.team_abbreviation
          : 'team' in player
            ? player.team
            : '';

      // Check if player's team is in any of the active games
      return Array.from(activeGameIds).some(gameId => {
        const [away, home] = gameId.split('@');
        return playerTeam === away || playerTeam === home;
      });
    });
  },

  reset: () =>
    set({
      currentSlate: null,
      selectedSlateId: null,
      players: [],
      playersBySlate: {},
      optimizedLineups: [],
      isOptimizing: false,
      isSimulating: false,
      slateSelection: {
        date: getTodayISO(),
        sport: 'NFL',
        site: 'DK',
      },
      activeGameIds: new Set<string>(),
      gamesData: [],
      weatherData: [],
      gamesLoading: false,
    }),
}));
