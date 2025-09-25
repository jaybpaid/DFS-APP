/**
 * Game Strip Component Tests
 * Unit tests for GameStrip functionality and weather integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameStrip } from '../../apps/web/src/components/GameStrip';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'h:mm a') return '8:20 PM';
    return '2025-09-18';
  })
}));

vi.mock('date-fns-tz', () => ({
  formatInTimeZone: vi.fn(() => '8:20 PM ET')
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Cloud: () => <div data-testid="cloud-icon" />,
  CloudRain: () => <div data-testid="rain-icon" />,
  CloudSnow: () => <div data-testid="snow-icon" />,
  Sun: () => <div data-testid="sun-icon" />,
  Wind: () => <div data-testid="wind-icon" />,
  Home: () => <div data-testid="dome-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  X: () => <div data-testid="x-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>
}));

describe('GameStrip Component', () => {
  const mockGames = [
    {
      gameId: 'PHI@DAL',
      away: 'PHI',
      home: 'DAL',
      kickoff: '2025-09-18T20:20:00Z',
      spread: -3.5,
      total: 47.5,
      teamTotals: { away: 22.0, home: 25.5 },
      venue: {
        stadium: 'AT&T Stadium',
        roof: 'RETRACTABLE_CLOSED' as const,
        city: 'Arlington',
        tz: 'America/Chicago'
      },
      weatherIcon: 'dome',
      weatherSummary: 'Indoor game',
      pace: {
        expectedPlays: 128,
        paceRank: 12
      }
    },
    {
      gameId: 'KC@BUF',
      away: 'KC',
      home: 'BUF',
      kickoff: '2025-09-18T21:00:00Z',
      spread: 2.5,
      total: 52.0,
      teamTotals: { away: 27.25, home: 24.75 },
      venue: {
        stadium: 'Highmark Stadium',
        roof: 'OPEN' as const,
        city: 'Buffalo',
        tz: 'America/New_York'
      },
      weatherIcon: 'wind_strong',
      weatherSummary: '22mph crosswind'
    }
  ];

  const mockWeather = [
    {
      gameId: 'PHI@DAL',
      tempF: 72,
      windMph: 0,
      precip: 0.0,
      impact: 'NONE' as const,
      summary: 'Indoor game',
      isDome: true
    },
    {
      gameId: 'KC@BUF',
      tempF: 45,
      windMph: 22,
      precip: 0.1,
      impact: 'MODERATE' as const,
      summary: '22mph crosswind',
      isDome: false
    }
  ];

  const defaultProps = {
    games: mockGames,
    weather: mockWeather,
    onToggleGame: vi.fn(),
    activeGameIds: new Set<string>(),
    loading: false,
    onRefresh: vi.fn(),
    asOf: '2025-09-18T19:00:00Z',
    provenance: ['dfs-mcp', 'weather-api']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders game tiles correctly', () => {
      render(<GameStrip {...defaultProps} />);
      
      expect(screen.getByText('PHI')).toBeInTheDocument();
      expect(screen.getByText('DAL')).toBeInTheDocument();
      expect(screen.getByText('KC')).toBeInTheDocument();
      expect(screen.getByText('BUF')).toBeInTheDocument();
    });

    it('displays game information correctly', () => {
      render(<GameStrip {...defaultProps} />);
      
      // Check spread and total
      expect(screen.getByText('DAL -3.5')).toBeInTheDocument();
      expect(screen.getByText('47.5')).toBeInTheDocument();
      expect(screen.getByText('52')).toBeInTheDocument();
      
      // Check team totals
      expect(screen.getByText('22')).toBeInTheDocument();
      expect(screen.getByText('25.5')).toBeInTheDocument();
      expect(screen.getByText('27.25')).toBeInTheDocument();
      expect(screen.getByText('24.75')).toBeInTheDocument();
    });

    it('shows weather information', () => {
      render(<GameStrip {...defaultProps} />);
      
      expect(screen.getByText('Dome')).toBeInTheDocument();
      expect(screen.getByText('22mph crosswind')).toBeInTheDocument();
    });

    it('displays loading state', () => {
      render(<GameStrip {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Loading games...')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('shows empty state when no games', () => {
      render(<GameStrip {...defaultProps} games={[]} />);
      
      expect(screen.getByText('No games available')).toBeInTheDocument();
      expect(screen.getByText('Check your slate selection')).toBeInTheDocument();
    });
  });

  describe('Game Filtering', () => {
    it('calls onToggleGame when game tile is clicked', async () => {
      const user = userEvent.setup();
      render(<GameStrip {...defaultProps} />);
      
      const phiDalTile = screen.getByText('PHI').closest('[role="button"]');
      await user.click(phiDalTile!);
      
      expect(defaultProps.onToggleGame).toHaveBeenCalledWith('PHI@DAL');
    });

    it('shows active state for selected games', () => {
      const activeGameIds = new Set(['PHI@DAL']);
      render(<GameStrip {...defaultProps} activeGameIds={activeGameIds} />);
      
      const phiDalTile = screen.getByText('PHI').closest('[role="button"]');
      expect(phiDalTile).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows clear filters button when games are selected', () => {
      const activeGameIds = new Set(['PHI@DAL', 'KC@BUF']);
      render(<GameStrip {...defaultProps} activeGameIds={activeGameIds} />);
      
      expect(screen.getByText('Clear filters (2)')).toBeInTheDocument();
    });

    it('clears all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      const activeGameIds = new Set(['PHI@DAL', 'KC@BUF']);
      render(<GameStrip {...defaultProps} activeGameIds={activeGameIds} />);
      
      const clearButton = screen.getByText('Clear filters (2)');
      await user.click(clearButton);
      
      expect(defaultProps.onToggleGame).toHaveBeenCalledWith('PHI@DAL');
      expect(defaultProps.onToggleGame).toHaveBeenCalledWith('KC@BUF');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<GameStrip {...defaultProps} />);
      
      const phiDalTile = screen.getByText('PHI').closest('[role="button"]');
      phiDalTile!.focus();
      await user.keyboard('{Enter}');
      
      expect(defaultProps.onToggleGame).toHaveBeenCalledWith('PHI@DAL');
    });
  });

  describe('Weather Integration', () => {
    it('displays correct weather icons', () => {
      render(<GameStrip {...defaultProps} />);
      
      expect(screen.getByTestId('dome-icon')).toBeInTheDocument();
      expect(screen.getByTestId('wind-icon')).toBeInTheDocument();
    });

    it('shows weather tooltips with detailed information', async () => {
      const user = userEvent.setup();
      render(<GameStrip {...defaultProps} />);
      
      // This would test tooltip content if we had proper tooltip mocking
      // For now, we verify the weather summary is displayed
      expect(screen.getByText('Indoor game')).toBeInTheDocument();
      expect(screen.getByText('22mph crosswind')).toBeInTheDocument();
    });
  });

  describe('Pace Indicators', () => {
    it('shows pace indicators for games with pace data', () => {
      render(<GameStrip {...defaultProps} />);
      
      expect(screen.getByText('128')).toBeInTheDocument();
    });

    it('applies correct pace colors based on ranking', () => {
      render(<GameStrip {...defaultProps} />);
      
      // Fast pace (rank 12) should show medium color
      const paceIndicator = screen.getByText('128').previousElementSibling;
      expect(paceIndicator).toHaveClass('bg-yellow-500');
    });
  });

  describe('Time Formatting', () => {
    it('formats kickoff times correctly', () => {
      render(<GameStrip {...defaultProps} />);
      
      // Should show formatted time from our mock
      expect(screen.getAllByText('8:20 PM')).toHaveLength(2);
    });
  });

  describe('Spread Formatting', () => {
    it('formats spreads correctly', () => {
      render(<GameStrip {...defaultProps} />);
      
      expect(screen.getByText('DAL -3.5')).toBeInTheDocument();
      expect(screen.getByText('BUF +2.5')).toBeInTheDocument();
    });

    it('shows PK for even spreads', () => {
      const evenSpreadGames = [{
        ...mockGames[0],
        spread: 0
      }];
      
      render(<GameStrip {...defaultProps} games={evenSpreadGames} />);
      
      expect(screen.getByText('PK')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('shows refresh button when onRefresh is provided', () => {
      render(<GameStrip {...defaultProps} />);
      
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', async () => {
      const user = userEvent.setup();
      render(<GameStrip {...defaultProps} />);
      
      const refreshButton = screen.getByTestId('refresh-icon').closest('button');
      await user.click(refreshButton!);
      
      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });

    it('shows last updated time', () => {
      render(<GameStrip {...defaultProps} />);
      
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<GameStrip {...defaultProps} />);
      
      const gameTiles = screen.getAllByRole('button');
      gameTiles.forEach(tile => {
        expect(tile).toHaveAttribute('aria-pressed');
        expect(tile).toHaveAttribute('tabIndex', '0');
      });
    });

    it('supports keyboard navigation with Space key', async () => {
      const user = userEvent.setup();
      render(<GameStrip {...defaultProps} />);
      
      const phiDalTile = screen.getByText('PHI').closest('[role="button"]');
      phiDalTile!.focus();
      await user.keyboard(' ');
      
      expect(defaultProps.onToggleGame).toHaveBeenCalledWith('PHI@DAL');
    });
  });

  describe('Responsive Design', () => {
    it('applies correct CSS classes for scrolling', () => {
      render(<GameStrip {...defaultProps} />);
      
      const scrollContainer = screen.getByText('PHI').closest('.overflow-x-auto');
      expect(scrollContainer).toHaveClass('overflow-x-auto', 'scrollbar-hide');
    });

    it('applies scroll snap styling', () => {
      render(<GameStrip {...defaultProps} />);
      
      const scrollContainer = screen.getByText('PHI').closest('.overflow-x-auto');
      expect(scrollContainer).toHaveStyle({ scrollSnapType: 'x mandatory' });
    });
  });

  describe('Game Sorting', () => {
    it('sorts games by kickoff time', () => {
      const unsortedGames = [mockGames[1], mockGames[0]]; // KC@BUF first, then PHI@DAL
      render(<GameStrip {...defaultProps} games={unsortedGames} />);
      
      const gameElements = screen.getAllByRole('button');
      const firstGame = gameElements[0];
      const secondGame = gameElements[1];
      
      // PHI@DAL should come first (earlier kickoff)
      expect(firstGame).toHaveTextContent('PHI');
      expect(secondGame).toHaveTextContent('KC');
    });
  });
});
