import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would query the database
    // For now, we'll return mock data that matches the dashboard expectations

    const stats = {
      totalSlates: 12,
      totalPlayers: 847,
      totalLineups: 156,
      totalSimulations: 8,
      recentUploads: 3,
      systemUptime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago

      // Additional stats for enhanced dashboard
      activeSlates: 4,
      completedOptimizations: 23,
      avgOptimizationTime: 12.5, // seconds
      totalProjections: 2341,

      // Recent activity
      recentActivity: [
        {
          id: '1',
          type: 'slate_upload',
          message: 'NFL Main Slate uploaded',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        },
        {
          id: '2',
          type: 'optimization',
          message: '20 lineups optimized',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        },
        {
          id: '3',
          type: 'simulation',
          message: 'Monte Carlo simulation completed',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        },
      ],

      // System health
      systemHealth: {
        database: 'healthy',
        redis: 'healthy',
        mcpServer: 'healthy',
        backgroundJobs: 'healthy',
      },

      // Performance metrics
      performance: {
        avgResponseTime: 145, // ms
        successRate: 0.998,
        errorRate: 0.002,
        throughput: 1250, // requests per hour
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard stats',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
