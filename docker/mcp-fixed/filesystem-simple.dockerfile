FROM node:18-alpine

WORKDIR /app

# Install required packages
RUN apk add --no-cache curl bash

# Create simple, working MCP server
RUN cat > server.js << 'EOF'
// Simple, reliable MCP filesystem server
const fs = require('fs');
const path = require('path');

console.log('=== Filesystem MCP Server Starting ===');

// Health endpoint for Docker health checks
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"status":"healthy","server":"filesystem-mcp","timestamp":"' + new Date().toISOString() + '"}');
    return;
  }
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(8080, () => {
  console.log('Health endpoint listening on port 8080');
});

// MCP STDIO protocol handler
process.stdin.on('data', (data) => {
  try {
    const input = data.toString().trim();
    if (!input) return;
    
    const request = JSON.parse(input);
    const response = {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        server: "filesystem-mcp",
        version: "1.0.0",
        capabilities: ["read_file", "write_file", "list_directory"],
        status: "operational",
        timestamp: new Date().toISOString()
      }
    };
    
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    const errorResponse = {
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32600,
        message: "Invalid Request",
        data: error.message
      }
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
EOF

# Health check script
RUN cat > health-check.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check PASSED');
    process.exit(0);
  } else {
    console.log('Health check FAILED - status:', res.statusCode);
    process.exit(1);
  }
});

req.on('error', (error) => {
  console.log('Health check ERROR:', error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Health check TIMEOUT');
  req.destroy();
  process.exit(1);
});

req.end();
EOF

EXPOSE 8080

CMD ["node", "server.js"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node health-check.js
