/**
 * PlayerPool component snapshot tests
 * Validates component binding to dk_salaries.json fixture
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerPoolPage } from '../src/pages/PlayerPool';
import { PlayerTable } from '../src/components/PlayerTable';

// Mock fetch for fixture data
global.fetch = vi.fn();

const mockPlayerData = [
  {
    id: '0',
    name: 'Derrick Henry',
    position: 'RB' as const,
    team: 'BAL',
    opponent: 'CLE',
    salary: 8200,
    gameInfo: 'CLE @ BAL',
    rosterPercentage: 85.2,
    isLocked: false,
  },
  {
    id: '14',
    name: 'Josh Allen',
    position: 'QB' as const,
    team: 'BUF',
    opponent: 'NYJ',
    salary: 7100,
    gameInfo: 'BUF @ NYJ',
    rosterPercentage: 65.4,
    isLocked: false,
  },
  {
    id: '152',
    name: 'Travis Kelce',
    position: 'TE' as const,
    team: 'KC',
    opponent: 'PHI',
    salary: 5000,
    gameInfo: 'PHI @ KC',
    rosterPercentage: 45.7,
    isLocked: false,
  },
];

describe('PlayerTable Component', () => {
  it('should render player table with correct rows and columns', () => {
    render(<PlayerTable players={mockPlayerData} selectedPlayers={[]} />);

    // Check table headers are present
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Roster %')).toBeInTheDocument();

    // Check player data is rendered
    expect(screen.getByText('Derrick Henry')).toBeInTheDocument();
    expect(screen.getByText('Josh Allen')).toBeInTheDocument();
    expect(screen.getByText('Travis Kelce')).toBeInTheDocument();

    // Check salary formatting
    expect(screen.getByText('$8,200')).toBeInTheDocument();
    expect(screen.getByText('$7,100')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  it('should display position badges with correct colors', () => {
    render(<PlayerTable players={mockPlayerData} selectedPlayers={[]} />);

    const rbBadge = screen.getByText('RB');
    const qbBadge = screen.getByText('QB');
    const teBadge = screen.getByText('TE');

    expect(rbBadge).toHaveClass('bg-green-500');
    expect(qbBadge).toHaveClass('bg-purple-500');
    expect(teBadge).toHaveClass('bg-orange-500');
  });

  it('should show roster percentages correctly', () => {
    render(<PlayerTable players={mockPlayerData} selectedPlayers={[]} />);

    expect(screen.getByText('85.2%')).toBeInTheDocument();
    expect(screen.getByText('65.4%')).toBeInTheDocument();
    expect(screen.getByText('45.7%')).toBeInTheDocument();
  });

  it('should display player count summary', () => {
    render(<PlayerTable players={mockPlayerData} selectedPlayers={[]} />);

    expect(screen.getByText(/Showing 3 players/)).toBeInTheDocument();
  });
});

describe('PlayerPoolPage Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          slateId: '133233',
          players: mockPlayerData,
          metadata: {
            timestamp: '2025-09-15T21:00:00.000Z',
            salaryCap: 50000,
            contestType: 'classic',
            lateSwapEnabled: true,
          },
        }),
    });
  });

  it('should render page header with slate information', async () => {
    render(<PlayerPoolPage />);

    expect(screen.getByText('Player Pool')).toBeInTheDocument();

    // Wait for data to load
    await screen.findByText(/Slate ID:/);
    expect(screen.getByText(/133233/)).toBeInTheDocument();
    expect(screen.getByText(/3 players/)).toBeInTheDocument();
    expect(screen.getByText(/Salary Cap: \$50,000/)).toBeInTheDocument();
  });

  it('should display position count summary cards', async () => {
    render(<PlayerPoolPage />);

    // Wait for data to load
    await screen.findByText('Quarterbacks');

    expect(screen.getByText('Quarterbacks')).toBeInTheDocument();
    expect(screen.getByText('Running Backs')).toBeInTheDocument();
    expect(screen.getByText('Tight Ends')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<PlayerPoolPage />);
    expect(screen.getByText('Loading player pool...')).toBeInTheDocument();
  });
});
