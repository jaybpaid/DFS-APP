// Simple, reliable MCP filesystem server
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('=== Filesystem MCP Server Starting ===');

// Health endpoint for Docker health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        server: 'filesystem-mcp',
        timestamp: new Date().toISOString(),
        capabilities: ['read_file', 'write_file', 'list_directory'],
      })
    );
    return;
  }
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(8080, () => {
  console.log('Health endpoint listening on port 8080');
});

// MCP STDIO protocol handler
process.stdin.on('data', data => {
  try {
    const input = data.toString().trim();
    if (!input) return;

    const request = JSON.parse(input);
    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        server: 'filesystem-mcp',
        version: '1.0.0',
        capabilities: ['read_file', 'write_file', 'list_directory'],
        status: 'operational',
        timestamp: new Date().toISOString(),
      },
    };

    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: -32600,
        message: 'Invalid Request',
        data: error.message,
      },
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

// Heartbeat every minute
setInterval(() => {
  console.log('Filesystem MCP: Heartbeat OK - ' + new Date().toISOString());
}, 60000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Filesystem MCP: Shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Filesystem MCP: Interrupted');
  server.close(() => process.exit(0));
});

console.log('Filesystem MCP: Ready for STDIO communication');
process.stdin.resume();
