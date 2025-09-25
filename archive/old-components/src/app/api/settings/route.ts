import { NextRequest, NextResponse } from 'next/server';

interface SystemSettings {
  projectionSources: {
    rotowire: boolean;
    fantasypros: boolean;
    sabersim: boolean;
    stokastic: boolean;
    awesemo: boolean;
  };
  refreshSchedule: {
    slates: number;
    projections: number;
    ownership: number;
  };
  notifications: {
    optimizationComplete: boolean;
    simulationComplete: boolean;
    dataRefresh: boolean;
    errors: boolean;
  };
  advanced: {
    cacheTimeout: number;
    maxConcurrentJobs: number;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

// In-memory settings store (in production, this would be in database)
let currentSettings: SystemSettings = {
  projectionSources: {
    rotowire: true,
    fantasypros: true,
    sabersim: false,
    stokastic: false,
    awesemo: false,
  },
  refreshSchedule: {
    slates: 15,
    projections: 10,
    ownership: 20,
  },
  notifications: {
    optimizationComplete: true,
    simulationComplete: true,
    dataRefresh: false,
    errors: true,
  },
  advanced: {
    cacheTimeout: 300,
    maxConcurrentJobs: 4,
    logLevel: 'info',
  },
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      settings: currentSettings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch settings',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newSettings: SystemSettings = await request.json();

    // Validate settings
    if (!newSettings.projectionSources || !newSettings.refreshSchedule) {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
    }

    // Update settings
    currentSettings = { ...currentSettings, ...newSettings };

    // In production, you would:
    // 1. Save to database
    // 2. Update MCP server configuration
    // 3. Restart background jobs if needed
    // 4. Update cron schedules

    console.log('Settings updated:', currentSettings);

    return NextResponse.json({
      success: true,
      settings: currentSettings,
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save settings',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Same as POST for settings
  return POST(request);
}
