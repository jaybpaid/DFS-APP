/**
 * Performance Load Testing for DFS Optimizer
 * Tests system performance under concurrent load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const optimizationTime = new Trend('optimization_time');
const simulationTime = new Trend('simulation_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '5m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<30000'], // 95% of requests must complete within 30s
    http_req_failed: ['rate<0.05'], // Error rate must be less than 5%
    errors: ['rate<0.05'], // Custom error rate
    optimization_time: ['p(95)<25000'], // 95% of optimizations within 25s
    simulation_time: ['p(95)<15000'], // 95% of simulations within 15s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:8000';

// Sample player data for testing
const samplePlayers = [
  {
    id: '1',
    name: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    salary: 8400,
    projected_points: 22.5,
    ownership: 0.28,
    controls: {
      locked: false,
      banned: false,
      min_exposure: 0,
      max_exposure: 100,
      custom_projection: null,
      projection_boost: 0,
      ownership_override: null,
      ownership_fade_boost: false,
      randomness_deviation: 10,
      ceiling_floor_toggle: 'projection',
      multi_pos_eligibility: [],
      salary_override: null,
      group_memberships: [],
      stack_role: 'none',
      injury_tag: 'ACTIVE',
      news_signal_badge: null,
      boom_percentage: 28.5,
      bust_percentage: 15.2,
      leverage_score: 1.25,
      matchup_score: 8.5,
      depth_chart_role: 'starter',
      hype_score: 7.2,
      late_swap_eligible: false,
      priority_tag: 'core',
      advanced_notes: '',
      duplication_risk: null,
    },
  },
  // Add more sample players...
];

const sampleConstraints = {
  salary_cap: 50000,
  max_from_team: 4,
  min_games: 2,
  unique_players: 9,
  qb_min: 1,
  qb_max: 1,
  rb_min: 2,
  rb_max: 3,
  wr_min: 3,
  wr_max: 4,
  te_min: 1,
  te_max: 2,
  dst_min: 1,
  dst_max: 1,
};

export default function () {
  const testScenario = Math.random();

  if (testScenario < 0.4) {
    // 40% - Test optimization endpoint
    testOptimization();
  } else if (testScenario < 0.7) {
    // 30% - Test simulation endpoint
    testSimulation();
  } else if (testScenario < 0.9) {
    // 20% - Test player pool endpoint
    testPlayerPool();
  } else {
    // 10% - Test frontend loading
    testFrontend();
  }

  sleep(1);
}

function testOptimization() {
  const payload = {
    slate_id: `test_slate_${Date.now()}`,
    players: samplePlayers,
    constraints: sampleConstraints,
    num_lineups: Math.floor(Math.random() * 50) + 10, // 10-60 lineups
    variance_settings: {
      enable_randomness: true,
      randomness_percentage: 15,
      distribution_mode: 'normal',
    },
  };

  const startTime = Date.now();
  const response = http.post(`${API_URL}/api/optimize`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '60s',
  });

  const duration = Date.now() - startTime;
  optimizationTime.add(duration);

  const success = check(response, {
    'optimization status is 200': r => r.status === 200,
    'optimization has lineups': r => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.lineups && data.lineups.length > 0;
      } catch {
        return false;
      }
    },
    'optimization completes within 30s': () => duration < 30000,
  });

  if (!success) {
    errorRate.add(1);
    console.error(`Optimization failed: ${response.status} - ${response.body}`);
  } else {
    errorRate.add(0);
  }
}

function testSimulation() {
  // First get some lineups to simulate
  const optimizationPayload = {
    slate_id: `sim_test_slate_${Date.now()}`,
    players: samplePlayers.slice(0, 15), // Smaller player pool for faster optimization
    constraints: sampleConstraints,
    num_lineups: 5,
  };

  const optimizationResponse = http.post(
    `${API_URL}/api/optimize`,
    JSON.stringify(optimizationPayload),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    }
  );

  if (optimizationResponse.status !== 200) {
    errorRate.add(1);
    return;
  }

  let optimizationData;
  try {
    optimizationData = JSON.parse(optimizationResponse.body);
  } catch {
    errorRate.add(1);
    return;
  }

  if (!optimizationData.success || !optimizationData.lineups) {
    errorRate.add(1);
    return;
  }

  // Now run simulation
  const simulationPayload = {
    slate_id: optimizationData.slate_id || `sim_test_slate_${Date.now()}`,
    players: samplePlayers.slice(0, 15),
    lineups: optimizationData.lineups,
    num_simulations: Math.floor(Math.random() * 5000) + 1000, // 1K-6K simulations
    seed: 42,
    distribution_type: 'normal',
  };

  const startTime = Date.now();
  const response = http.post(
    `${API_URL}/api/simulate`,
    JSON.stringify(simulationPayload),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '30s',
    }
  );

  const duration = Date.now() - startTime;
  simulationTime.add(duration);

  const success = check(response, {
    'simulation status is 200': r => r.status === 200,
    'simulation has results': r => {
      try {
        const data = JSON.parse(r.body);
        return data.success && data.player_outcomes && data.lineup_results;
      } catch {
        return false;
      }
    },
    'simulation completes within 20s': () => duration < 20000,
  });

  if (!success) {
    errorRate.add(1);
    console.error(`Simulation failed: ${response.status} - ${response.body}`);
  } else {
    errorRate.add(0);
  }
}

function testPlayerPool() {
  const slateId = `test_slate_${Date.now()}`;

  const response = http.get(`${API_URL}/api/player-pool/${slateId}`, {
    timeout: '10s',
  });

  const success = check(response, {
    'player pool status is 200 or 404': r => r.status === 200 || r.status === 404,
    'player pool responds quickly': r => r.timings.duration < 5000,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

function testFrontend() {
  const response = http.get(`${BASE_URL}/optimizer`, {
    timeout: '10s',
  });

  const success = check(response, {
    'frontend status is 200': r => r.status === 200,
    'frontend loads quickly': r => r.timings.duration < 3000,
    'frontend has content': r => r.body.length > 1000,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

export function handleSummary(data) {
  return {
    'performance-results.json': JSON.stringify(data, null, 2),
    stdout: `
Performance Test Summary:
========================
Total Requests: ${data.metrics.http_reqs.count}
Failed Requests: ${data.metrics.http_req_failed.count} (${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%)
Average Response Time: ${data.metrics.http_req_duration.avg.toFixed(2)}ms
95th Percentile Response Time: ${data.metrics.http_req_duration['p(95)'].toFixed(2)}ms

Optimization Performance:
- Average Time: ${data.metrics.optimization_time ? data.metrics.optimization_time.avg.toFixed(2) : 'N/A'}ms
- 95th Percentile: ${data.metrics.optimization_time ? data.metrics.optimization_time['p(95)'].toFixed(2) : 'N/A'}ms

Simulation Performance:
- Average Time: ${data.metrics.simulation_time ? data.metrics.simulation_time.avg.toFixed(2) : 'N/A'}ms
- 95th Percentile: ${data.metrics.simulation_time ? data.metrics.simulation_time['p(95)'].toFixed(2) : 'N/A'}ms

Error Rate: ${(data.metrics.errors.rate * 100).toFixed(2)}%
`,
  };
}
