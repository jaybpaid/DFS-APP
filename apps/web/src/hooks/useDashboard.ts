import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  draftKingsAPI,
  getActiveNFLSlates,
  getActiveNBASlates,
} from '@/lib/draftkings-api';
import { DashboardStats, DataSource } from '@shared/schema';

export function useDashboard(sport: 'nfl' | 'nba') {
  const queryClient = useQueryClient();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats', sport],
    staleTime: 2 * 60 * 1000, // 2 minutes
  }) as { data: any; isLoading: boolean };

  // Live DraftKings data
  const { data: liveSlates, isLoading: slatesLoading } = useQuery({
    queryKey: ['draftkings-slates', sport],
    queryFn: () => (sport === 'nfl' ? getActiveNFLSlates() : getActiveNBASlates()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Extract data sources from dashboard stats
  const dataSources: DataSource[] =
    dashboardStats?.dataSources?.map((source: any) => ({
      id: source.name,
      name: source.name,
      type: 'live',
      last_updated: source.lastUpdate,
      status: source.status === 'success' ? 'healthy' : 'error',
      playerCount: 0,
      sport: source.sport,
      category: 'core',
      isEnabled: true,
      lastUpdate: source.lastUpdate,
    })) || [];

  const refreshData = async () => {
    try {
      await apiRequest('POST', '/api/data/refresh', { sport });
      // Invalidate and refetch dashboard stats
      await queryClient.invalidateQueries({
        queryKey: ['/api/dashboard/stats', sport],
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  };

  return {
    dashboardStats,
    dataSources,
    liveSlates: liveSlates || [],
    isLoading: statsLoading || slatesLoading,
    refreshData,
  };
}
