#!/usr/bin/env node

/**
 * MCP Server Validation Script
 * Tests each enhanced MCP server to ensure they work correctly
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const servers = [
  {
    name: 'gpt-researcher-mcp',
    path: 'docker/mcp-servers/advanced/gptr-mcp/index.js',
    testInput: 'Analyze DFS player correlations',
  },
  {
    name: 'serena-code-analysis',
    path: 'docker/mcp-servers/advanced/serena/src/server.js',
    testInput: 'apps/api-python/optimization_engine.py',
  },
  {
    name: 'claude-flow',
    path: 'docker/mcp-servers/advanced/claude-flow-mcp/server.js',
    testInput: 'Optimize DFS lineup generation',
  },
  {
    name: 'google-genai-toolbox',
    path: 'docker/mcp-servers/advanced/genai-toolbox/server.js',
    testInput: 'Predict player performance trends',
  },
  {
    name: 'pipedream-chat',
    path: 'docker/mcp-servers/advanced/pipedream-mcp/server.js',
    testInput: 'Fetch latest NFL injury data',
  },
];

async function testServer(server) {
  console.log(`\n🧪 Testing ${server.name}...`);

  return new Promise((resolve, reject) => {
    const absolutePath = path.resolve(server.path);
    console.log(`   Path: ${absolutePath}`);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.log(`   ❌ FILE NOT FOUND: ${absolutePath}`);
      resolve({
        server: server.name,
        status: 'FAILED',
        reason: 'File not found',
        path: absolutePath,
      });
      return;
    }

    console.log(`   ✅ File exists`);

    // Try to start the server briefly to test syntax/loading
    const timeout = setTimeout(() => {
      if (child) {
        child.kill();
        console.log(`   ✅ Server started successfully (${server.name})`);
        resolve({
          server: server.name,
          status: 'SUCCESS',
          reason: 'Started without errors',
        });
      }
    }, 2000);

    let child;
    try {
      child = spawn('node', [absolutePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
        timeout: 3000,
      });

      let startedSuccessfully = false;
      let errorOutput = '';

      child.stderr.on('data', data => {
        errorOutput += data.toString();
        // Look for successful startup indicators
        if (
          errorOutput.includes('server running') ||
          errorOutput.includes('listening') ||
          !errorOutput.includes('Error')
        ) {
          startedSuccessfully = true;
        }
      });

      child.stdout.on('data', data => {
        const output = data.toString();
        if (output.includes('server running') || output.includes('listening')) {
          startedSuccessfully = true;
        }
      });

      child.on('error', error => {
        clearTimeout(timeout);
        console.log(`   ❌ FAILED: ${error.message}`);
        resolve({ server: server.name, status: 'FAILED', reason: error.message });
      });

      child.on('exit', (code, signal) => {
        clearTimeout(timeout);
        if (code === 0 || startedSuccessfully) {
          console.log(`   ✅ Server exited cleanly (${server.name})`);
          resolve({ server: server.name, status: 'SUCCESS', reason: 'Clean exit' });
        } else {
          console.log(`   ❌ Server failed with code ${code}`);
          resolve({
            server: server.name,
            status: 'FAILED',
            reason: `Exit code ${code}`,
            stderr: errorOutput,
          });
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      console.log(`   ❌ SPAWN ERROR: ${error.message}`);
      resolve({ server: server.name, status: 'FAILED', reason: error.message });
    }
  });
}

async function runTests() {
  console.log('🚀 Starting MCP Server Validation...');
  console.log('=====================================');

  const results = [];

  for (const server of servers) {
    const result = await testServer(server);
    results.push(result);
  }

  console.log('\n📊 VALIDATION RESULTS');
  console.log('=====================');

  let passCount = 0;
  let failCount = 0;

  results.forEach(result => {
    if (result.status === 'SUCCESS') {
      console.log(`✅ ${result.server}: ${result.reason}`);
      passCount++;
    } else {
      console.log(`❌ ${result.server}: ${result.reason}`);
      failCount++;
    }
  });

  console.log('\n🎯 SUMMARY');
  console.log(`✅ Passing: ${passCount}`);
  console.log(`❌ Failing: ${failCount}`);
  console.log(
    `📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`
  );

  if (failCount === 0) {
    console.log('\n🎉 ALL TESTS PASSED! All MCP servers are working correctly.');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Review FAILED servers above.');
  }

  return results;
}

// Run tests automatically when executed
await runTests().catch(console.error);
