import { NextRequest, NextResponse } from 'next/server';
import {
  parseSalaryCsv,
  parseContestCsv,
  parseLineupsCsv,
} from '@dfs-optimizer/core/csv';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const site = formData.get('site') as string;
    const sport = formData.get('sport') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!['salary', 'contest', 'lineup'].includes(type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Read file content
    const csvContent = await file.text();

    // Parse based on type
    let parsedData;
    let recordCount = 0;

    switch (type) {
      case 'salary':
        parsedData = parseSalaryCsv(csvContent);
        recordCount = parsedData.length;

        // Call MCP server to upload slate
        const mcpResponse = await fetch(
          `${process.env.MCP_SERVER_URL || 'http://localhost:4000'}/upload_slate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              csvContent,
              slateType: 'CLASSIC',
              site: site.toUpperCase(),
              sport: sport.toUpperCase(),
            }),
          }
        );

        if (!mcpResponse.ok) {
          throw new Error('Failed to upload slate to MCP server');
        }

        const mcpResult = await mcpResponse.json();

        return NextResponse.json({
          success: true,
          recordCount,
          slateId: mcpResult.slateId,
          message: `Successfully processed ${recordCount} players`,
          slate: {
            id: mcpResult.slateId,
            name: `${sport} ${site} Slate`,
            displayName: `${sport} ${site} Slate - ${new Date().toLocaleDateString()}`,
            sport: sport.toUpperCase(),
            site: site.toUpperCase(),
            slateType: 'CLASSIC',
            startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            isLive: false,
            isLocked: false,
            salaryCap: 50000,
            rosterSize: 9,
            playerCount: recordCount,
            lineupCount: 0,
          },
        });

      case 'contest':
        parsedData = parseContestCsv(csvContent);
        recordCount = parsedData.length;
        break;

      case 'lineup':
        parsedData = parseLineupsCsv(csvContent);
        recordCount = parsedData.length;
        break;

      default:
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      recordCount,
      message: `Successfully processed ${recordCount} ${type} records`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload endpoint - use POST to upload files',
    supportedTypes: ['salary', 'contest', 'lineup'],
    maxFileSize: '10MB',
    supportedFormats: ['.csv'],
  });
}
