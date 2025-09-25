import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params;
    const searchParams = request.nextUrl.searchParams;

    // Build MCP server URL
    const mcpUrl = new URL(`/${path.join('/')}`, MCP_SERVER_URL);
    searchParams.forEach((value, key) => {
      mcpUrl.searchParams.append(key, value);
    });

    // Forward request to MCP server
    const response = await fetch(mcpUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DFS-Optimizer-Web/1.0.0',
      },
    });

    if (!response.ok) {
      throw new Error(
        `MCP server responded with ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('MCP proxy error:', error);
    return NextResponse.json(
      {
        error: 'MCP server communication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params;
    const body = await request.json();

    // Build MCP server URL
    const mcpUrl = new URL(`/${path.join('/')}`, MCP_SERVER_URL);

    // Forward request to MCP server
    const response = await fetch(mcpUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DFS-Optimizer-Web/1.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `MCP server responded with ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('MCP proxy error:', error);
    return NextResponse.json(
      {
        error: 'MCP server communication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params;
    const body = await request.json();

    // Build MCP server URL
    const mcpUrl = new URL(`/${path.join('/')}`, MCP_SERVER_URL);

    // Forward request to MCP server
    const response = await fetch(mcpUrl.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DFS-Optimizer-Web/1.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `MCP server responded with ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('MCP proxy error:', error);
    return NextResponse.json(
      {
        error: 'MCP server communication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params;

    // Build MCP server URL
    const mcpUrl = new URL(`/${path.join('/')}`, MCP_SERVER_URL);

    // Forward request to MCP server
    const response = await fetch(mcpUrl.toString(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DFS-Optimizer-Web/1.0.0',
      },
    });

    if (!response.ok) {
      throw new Error(
        `MCP server responded with ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('MCP proxy error:', error);
    return NextResponse.json(
      {
        error: 'MCP server communication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
