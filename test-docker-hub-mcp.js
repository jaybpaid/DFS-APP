#!/usr/bin/env node

// Simple test script to verify Docker Hub MCP server functionality
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Docker Hub MCP Server...');
console.log('=====================================');

const serverPath = path.join(__dirname, 'docker-hub-mcp-server', 'dist', 'index.js');
const serverProcess = spawn('node', [serverPath, '--transport=stdio'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let responseBuffer = '';

// Handle server output
serverProcess.stdout.on('data', data => {
  const output = data.toString();
  console.log('📤 Server output:', output.trim());
  responseBuffer += output;
});

// Handle server errors
serverProcess.stderr.on('data', data => {
  console.error('❌ Server error:', data.toString().trim());
});

// Send initialization message
setTimeout(() => {
  console.log('📤 Sending initialization message...');
  const initMessage =
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    }) + '\n';

  serverProcess.stdin.write(initMessage);
}, 1000);

// Send tools list request
setTimeout(() => {
  console.log('📤 Requesting tools list...');
  const toolsMessage =
    JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }) + '\n';

  serverProcess.stdin.write(toolsMessage);
}, 2000);

// Close after test
setTimeout(() => {
  console.log('📤 Closing test...');
  serverProcess.stdin.end();

  setTimeout(() => {
    console.log('✅ Test completed!');
    process.exit(0);
  }, 1000);
}, 5000);

serverProcess.on('close', code => {
  console.log(`📤 Server process exited with code ${code}`);
});
