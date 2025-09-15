import { useState, useEffect } from 'react';
import { Player, Sport } from '../data/types';
import { DraftKingsProvider } from '../data/providers/draftkings';

export const usePlayerData = (sport: Sport = 'NFL') => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlate, setSelectedSlate] = useState<string | null>(null);

  const loadPlayers = async (slateId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new DraftKingsProvider(sport);
      
      // If no slate specified, get available slates and use the first one
      if (!slateId) {
        const slates = await provider.getAvailableSlates();
        if (slates.length === 0) {
          throw new Error(`No available slates found for ${sport}`);
        }
        slateId = slates[0].id;
      }
      
      await provider.selectSlate(slateId);
      const playerData = await provider.getPlayers();
      
      // Validate the player pool
      const validation = await provider.validatePlayerPool(playerData);
      if (!validation.isValid) {
        console.warn('Player pool validation warnings:', validation.errors);
      }
      
      setPlayers(playerData);
      setSelectedSlate(slateId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load player data');
      console.error('Error loading player data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshPlayers = async () => {
    if (selectedSlate) {
      await loadPlayers(selectedSlate);
    } else {
      await loadPlayers();
    }
  };

  // Load players on mount
  useEffect(() => {
    loadPlayers();
  }, [sport]);

  return {
    players,
    loading,
    error,
    selectedSlate,
    loadPlayers,
    refreshPlayers
  };
};
