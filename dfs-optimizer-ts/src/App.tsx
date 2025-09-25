import React from 'react';
import ProfessionalTabs from './components/ProfessionalTabs';
import { usePlayerData } from './hooks/usePlayerData';
import { Player } from './data/types';

function App() {
  const { players, loading, error, refreshPlayers } = usePlayerData('NFL');

  const handlePlayersUpdate = (updatedPlayers: Player[]) => {
    // In a real implementation, this would update the players in the data store
    // For now, we'll just log the update since we're using the hook for data loading
    console.log('Players updated:', updatedPlayers);
  };

  return (
    <div className='container'>
      <header className='text-center mb-8'>
        <h1
          style={{
            color: 'white',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          DFS Optimizer Pro
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem' }}>
          Professional Daily Fantasy Sports Lineup Builder
        </p>
      </header>

      {loading && (
        <div className='card text-center'>
          <div className='spinner'></div>
          <p>Loading player data...</p>
        </div>
      )}

      {error && (
        <div className='card text-center error'>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={refreshPlayers} className='btn btn-primary'>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && players.length > 0 && (
        <ProfessionalTabs players={players} onPlayersUpdate={handlePlayersUpdate} />
      )}
    </div>
  );
}

export default App;
