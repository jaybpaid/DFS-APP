import { useState } from 'react';
import { Card } from '@/components/ui/card';
import ProjectionsTab from './ProjectionsTab';
import OptimizerTab from './OptimizerTab';
import LineupsTab from './LineupsTab';
import ExportTab from './ExportTab';

interface MainTabsProps {
  selectedSport: 'nfl' | 'nba';
  selectedSite: 'dk' | 'fd';
  activeSlateId: string | null;
}

type TabType = 'projections' | 'optimizer' | 'lineups' | 'export';

export default function MainTabs({
  selectedSport,
  selectedSite,
  activeSlateId,
}: MainTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('projections');

  const tabs = [
    { id: 'projections', label: 'Player Projections' },
    { id: 'optimizer', label: 'Lineup Optimizer' },
    { id: 'lineups', label: 'Generated Lineups' },
    { id: 'export', label: 'Export & Late Swap' },
  ] as const;

  return (
    <Card>
      <div className='border-b border-border px-6'>
        <nav className='flex space-x-8'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
              data-testid={`button-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className='p-6'>
        {activeTab === 'projections' && (
          <ProjectionsTab
            selectedSport={selectedSport}
            selectedSite={selectedSite}
            activeSlateId={activeSlateId}
          />
        )}

        {activeTab === 'optimizer' && (
          <OptimizerTab
            selectedSport={selectedSport}
            selectedSite={selectedSite}
            activeSlateId={activeSlateId}
          />
        )}

        {activeTab === 'lineups' && (
          <LineupsTab
            selectedSport={selectedSport}
            selectedSite={selectedSite}
            activeSlateId={activeSlateId}
          />
        )}

        {activeTab === 'export' && (
          <ExportTab
            selectedSport={selectedSport}
            selectedSite={selectedSite}
            activeSlateId={activeSlateId}
          />
        )}
      </div>
    </Card>
  );
}
