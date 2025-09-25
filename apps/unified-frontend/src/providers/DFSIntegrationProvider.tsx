import React, { createContext, useContext, useEffect, useState } from 'react';
import { DFSIntegrationBridge } from '../../../../integration/api-bridge';
import { useToast } from '@/hooks/use-toast';

// Types for the integrated DFS platform
export interface DFSPlayer {
  id: string;
  name: string;
  position: string;
  salary: number;
  projection: number;
  ownership?: number;
  team: string;
  opponent?: string;
  gameInfo?: {
    gameTime: string;
    weather?: string;
    spread?: number;
    total?: number;
  };
}

export interface DFSLineup {
  id: string;
  players: DFSPlayer[];
  totalSalary: number;
  projection: number;
  ownership?: number;
  leverage?: number;
}

export interface OptimizationConfig {
  sport: 'nfl' | 'nba' | 'mlb' | 'nhl';
  site: 'dk' | 'fd';
  lineupCount: number;
  objective: 'ev' | 'projection' | 'hybrid' | 'ceiling';
  simulationRuns?: number;
  stackingEnabled?: boolean;
  lockedPlayers?: string[];
  bannedPlayers?: string[];
  exposureSettings?: {
    maxExposure?: number;
    minExposure?: number;
    maxPerTeam?: number;
  };
}

export interface DFSContextType {
  // Data
  players: DFSPlayer[];
  slates: any[];
  lineups: DFSLineup[];

  // Loading states
  isLoadingPlayers: boolean;
  isLoadingSlates: boolean;
  isOptimizing: boolean;
  isSimulating: boolean;

  // Configuration
  selectedSport: 'nfl' | 'nba' | 'mlb' | 'nhl';
  selectedSite: 'dk' | 'fd';
  optimizationConfig: OptimizationConfig;

  // Actions
  setSelectedSport: (sport: 'nfl' | 'nba' | 'mlb' | 'nhl') => void;
  setSelectedSite: (site: 'dk' | 'fd') => void;
  updateOptimizationConfig: (config: Partial<OptimizationConfig>) => void;

  // API Methods
  refreshPlayers: () => Promise<void>;
  refreshSlates: () => Promise<void>;
  generateLineups: () => Promise<void>;
  runSimulation: (config: {
    simulationCount: number;
    fieldSize: number;
  }) => Promise<any>;
  exportLineups: (format?: 'dk' | 'fd') => Promise<string>;

  // Health
  backendHealth: {
    dfsSystem2: boolean;
    draftKingsApi: boolean;
  };
}

const DFSContext = createContext<DFSContextType | null>(null);

export function DFSIntegrationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [bridge] = useState(() => new DFSIntegrationBridge());

  // State
  const [players, setPlayers] = useState<DFSPlayer[]>([]);
  const [slates, setSlates] = useState<any[]>([]);
  const [lineups, setLineups] = useState<DFSLineup[]>([]);

  // Loading states
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isLoadingSlates, setIsLoadingSlates] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Configuration
  const [selectedSport, setSelectedSport] = useState<'nfl' | 'nba' | 'mlb' | 'nhl'>(
    'nfl'
  );
  const [selectedSite, setSelectedSite] = useState<'dk' | 'fd'>('dk');
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    sport: 'nfl',
    site: 'dk',
    lineupCount: 20,
    objective: 'projection',
    simulationRuns: 10000,
    stackingEnabled: true,
    lockedPlayers: [],
    bannedPlayers: [],
    exposureSettings: {
      maxExposure: 25,
      minExposure: 0,
      maxPerTeam: 4,
    },
  });

  // Health monitoring
  const [backendHealth, setBackendHealth] = useState({
    dfsSystem2: false,
    draftKingsApi: false,
  });

  // Actions
  const updateOptimizationConfig = (config: Partial<OptimizationConfig>) => {
    setOptimizationConfig(prev => ({ ...prev, ...config }));
  };

  // API Methods
  const refreshPlayers = async () => {
    // Check if sport is coming soon
    if (selectedSport === 'mlb' || selectedSport === 'nhl') {
      toast({
        title: 'Coming Soon',
        description: `${selectedSport.toUpperCase()} optimization will be available soon!`,
      });
      return;
    }

    setIsLoadingPlayers(true);
    try {
      const playersData = await bridge.getPlayers(selectedSport);
      setPlayers(playersData);
      toast({
        title: 'Players Updated',
        description: `Loaded ${playersData.length} players for ${selectedSport.toUpperCase()} on ${selectedSite.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error refreshing players:', error);
      toast({
        title: 'Error Loading Players',
        description: 'Failed to load player data. Check backend connection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const refreshSlates = async () => {
    // Check if sport is coming soon
    if (selectedSport === 'mlb' || selectedSport === 'nhl') {
      return;
    }

    setIsLoadingSlates(true);
    try {
      const slatesData = await bridge.getSlates(selectedSport);
      setSlates(slatesData);
      toast({
        title: 'Slates Updated',
        description: `Loaded ${slatesData.length} slates for ${selectedSport.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error refreshing slates:', error);
      toast({
        title: 'Error Loading Slates',
        description: 'Failed to load slate data. Check backend connection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSlates(false);
    }
  };

  const generateLineups = async () => {
    // Check if sport is coming soon
    if (selectedSport === 'mlb' || selectedSport === 'nhl') {
      toast({
        title: 'Coming Soon',
        description: `${selectedSport.toUpperCase()} optimization will be available soon!`,
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const lineupsData = await bridge.generateLineups(optimizationConfig);
      setLineups(lineupsData);
      toast({
        title: 'Lineups Generated',
        description: `Generated ${lineupsData.length} optimized lineups using DFS-SYSTEM-2`,
      });
    } catch (error) {
      console.error('Error generating lineups:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Failed to generate lineups. Check optimization settings.',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const runSimulation = async (config: {
    simulationCount: number;
    fieldSize: number;
  }) => {
    setIsSimulating(true);
    try {
      const simulationResults = await bridge.runSimulation({
        lineups: lineups,
        simulationCount: config.simulationCount,
        fieldSize: config.fieldSize,
      });

      toast({
        title: 'Simulation Complete',
        description: `Ran ${config.simulationCount.toLocaleString()} simulations with ${config.fieldSize} field size`,
      });

      return simulationResults;
    } catch (error) {
      console.error('Error running simulation:', error);
      toast({
        title: 'Simulation Failed',
        description: 'Failed to run Monte Carlo simulation.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSimulating(false);
    }
  };

  const exportLineups = async (format: 'dk' | 'fd' = selectedSite) => {
    try {
      const csvContent = await bridge.exportLineups(lineups, format);

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dfs_lineups_${selectedSport}_${format}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Downloaded ${lineups.length} lineups in ${format.toUpperCase()} format`,
      });

      return csvContent;
    } catch (error) {
      console.error('Error exporting lineups:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export lineups.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Health check effect
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await bridge.healthCheck();
        setBackendHealth(health);
      } catch (error) {
        console.error('Health check failed:', error);
        setBackendHealth({ dfsSystem2: false, draftKingsApi: false });
      }
    };

    // Initial health check
    checkHealth();

    // Periodic health checks every 30 seconds
    const healthInterval = setInterval(checkHealth, 30000);

    return () => clearInterval(healthInterval);
  }, [bridge]);

  // Auto-refresh data when sport/site changes
  useEffect(() => {
    setOptimizationConfig(prev => ({
      ...prev,
      sport: selectedSport,
      site: selectedSite,
    }));

    // Auto-refresh players and slates
    if (backendHealth.dfsSystem2 && backendHealth.draftKingsApi) {
      refreshPlayers();
      refreshSlates();
    }
  }, [
    selectedSport,
    selectedSite,
    backendHealth.dfsSystem2,
    backendHealth.draftKingsApi,
    refreshPlayers,
    refreshSlates,
  ]);

  const contextValue: DFSContextType = {
    // Data
    players,
    slates,
    lineups,

    // Loading states
    isLoadingPlayers,
    isLoadingSlates,
    isOptimizing,
    isSimulating,

    // Configuration
    selectedSport,
    selectedSite,
    optimizationConfig,

    // Actions
    setSelectedSport,
    setSelectedSite,
    updateOptimizationConfig,

    // API Methods
    refreshPlayers,
    refreshSlates,
    generateLineups,
    runSimulation,
    exportLineups,

    // Health
    backendHealth,
  };

  return <DFSContext.Provider value={contextValue}>{children}</DFSContext.Provider>;
}

export function useDFSIntegration() {
  const context = useContext(DFSContext);
  if (!context) {
    throw new Error('useDFSIntegration must be used within a DFSIntegrationProvider');
  }
  return context;
}
