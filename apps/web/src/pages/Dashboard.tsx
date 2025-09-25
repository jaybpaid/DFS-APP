import { useState } from 'react';
import HeaderNav from '@/components/HeaderNav';
import Sidebar from '@/components/Sidebar';
import StatusCards from '@/components/StatusCards';
import MainTabs from '@/components/MainTabs';
import AttributionPanel from '@/components/AttributionPanel';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardStats } from '@shared/schema';

export default function Dashboard() {
  const [selectedSport, setSelectedSport] = useState<'nfl' | 'nba'>('nfl');
  const [selectedSite, setSelectedSite] = useState<'dk' | 'fd'>('dk');
  const [activeSlateId, setActiveSlateId] = useState<string | null>(null);

  const { dashboardStats, dataSources, isLoading, refreshData } =
    useDashboard(selectedSport);
  const typedStats = dashboardStats as DashboardStats | null;

  return (
    <div className='min-h-screen bg-background'>
      <HeaderNav dataSources={dataSources} isLoading={isLoading} />

      <div className='flex'>
        <Sidebar
          selectedSport={selectedSport}
          selectedSite={selectedSite}
          onSportChange={setSelectedSport}
          onSiteChange={setSelectedSite}
          onSlateUploaded={setActiveSlateId}
          onRefreshData={refreshData}
        />

        <main className='flex-1 p-6 space-y-6 custom-scrollbar overflow-auto'>
          <StatusCards stats={typedStats} isLoading={isLoading} />

          <MainTabs
            selectedSport={selectedSport}
            selectedSite={selectedSite}
            activeSlateId={activeSlateId}
          />

          <AttributionPanel />
        </main>
      </div>
    </div>
  );
}
