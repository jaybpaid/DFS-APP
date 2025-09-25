# Dual-Fleet MCP Federation Implementation

## Overview

Successfully implemented a complete **Dual-Fleet MCP Federation** system that replaces the previous single-MCP-server approach with a federated architecture providing **gateway-based routing**, **policy-based access control**, and **comprehensive monitoring**.

## Architecture

### Core Components

- **Single Client Entry**: `claude_desktop_config.json` → only one MCP server: "dfs-gateway"
- **Namespaces**:
  - `app.<tool>.*` - Application tools (DFS optimization, data sources)
  - `ext.<tool>.*` - External tools (Brave Search, GitHub, filesystem, etc.)
- **Policy Routing**: Configurable precedence, allowlist/denylist, fallback mechanisms
- **Lazy Loading**: External tools start on first call, app tools spawn local processes

### Gateway Features

- **Circuit Breaker**: 5-second timeout, retry logic, failure detection
- **Redis Caching**: Request/response caching with TTL
- **Rate Limiting**: Configurable per-tool/per-namespace limits
- **Health Monitoring**: `/healthz` endpoint with per-namespace health status
- **Prometheus Metrics**: Comprehensive monitoring and alerting
- **Auditing**: Structured JSON logs with evidence stored in `_federation/evidence/`

## Files Created/Updated

### Gateway Services (`services/gateway/`)

1. **`registry.ts`** - Tool registration, server management, policy routing
2. **`router.ts`** - Request routing, process management, execution
3. **`cache.ts`** - LRU caching, TTL management, Redis integration
4. **`metrics.ts`** - Prometheus metrics collection, alerts
5. **`logger.ts`** - Structured JSON logging, log levels
6. **`index.ts`** - MCP server implementation, health endpoints

### Configuration Files

1. **`shims/mcp-gateway.sh`** - Bootstrap script for DFS Gateway
2. **`claude_desktop_config.json`** - Single MCP server configuration
3. **`.env.example`** - Complete environment configuration template
4. **`docker-compose.yml`** - Federation profiles, external tool containers

### Evidence Directory

- **`./_federation/evidence/`** - Stores all federation operation logs and audit trails

## Docker Deployment

### Profiles Available

```bash
# Start gateway only
docker-compose --profile gateway up

# Start external tools (Brave, GitHub, Puppeteer, etc.)
docker-compose --profile external-tools up

# Start monitoring stack (Prometheus + Grafana)
docker-compose --profile monitoring up

# Start full federation
docker-compose --profile gateway --profile external-tools --profile monitoring up
```

### Services

- **dfs-gateway**: Main federation server with HTTP health/metrics endpoints
- **postgres**: Database for application data
- **redis**: Caching and session storage
- **prometheus**: Metrics collection and storage
- **grafana**: Metrics visualization dashboard
- **brave-search-external, github-external, etc.**: External MCP server containers

## Key Features Implemented

### 1. Policy-Based Routing

```json
{
  "namespace": "app",
  "toolPattern": "*",
  "action": "allow",
  "priority": 1000
}
```

- **Precedence**: app > ext namespace priority
- **Fallback**: Automatic fallback to external tools on app tool failure
- **Denylist**: Block specific tools/namespaces
- **Rate Limiting**: Per-tool/per-namespace limits

### 2. Reliability Features

- **Circuit Breaker**: Timeout=5s, retries=2
- **Health Checks**: Per-tool health monitoring
- **Graceful Degradation**: Fallback mechanisms
- **Process Management**: Lazy starting, automatic cleanup

### 3. Monitoring & Observability

- **Prometheus Metrics**: Request duration, cache hits/misses, error rates
- **Structured Logging**: JSON format with correlation IDs
- **Health Endpoints**: `/healthz` with detailed status
- **Evidence Collection**: All operations logged to files

### 4. Caching Strategy

- **Request Cache**: 1-minute TTL for identical requests
- **Result Cache**: 5-minute TTL for successful responses
- **Tag-Based Invalidation**: Evict related entries
- **TTL Management**: Configurable lifetimes

## Configuration

### Environment Variables

```bash
# Gateway
LOG_LEVEL=INFO
ENABLE_HEALTH=true
HEALTH_PORT=8080
ENABLE_METRICS=true
METRICS_PORT=9090

# Servers
EXTERNAL_SERVERS=./shims/brave-search.sh,./shims/github.sh
APP_SERVERS=./mcp-servers/dfs-mcp/dist/index.js

# Database & Cache
DATABASE_URL=postgresql://dfs_user:password@localhost:5432/dfs_optimizer
REDIS_URL=redis://localhost:6379
```

## Usage

### Starting the Federation

```bash
# Local development
./shims/mcp-gateway.sh

# Docker deployment
docker-compose --profile gateway up

# Full system with monitoring
docker-compose --profile gateway --profile external-tools --profile monitoring up
```

### Tool Access Patterns

- `app.optimize.lineup` - DFS lineup optimization (high priority, app namespace)
- `ext.brave.search` - Web search (fallback to external namespace)
- `app.data.slate` - Slate data retrieval (app namespace preferred)

### Health Check

```bash
curl http://localhost:8080/healthz
# Returns detailed health status for all namespaces and tools
```

### Metrics

```bash
# Prometheus format
curl http://localhost:9090/metrics

# Metrics include:
# - gateway_requests_total
# - gateway_request_duration_seconds
# - gateway_cache_hits_total
# - gateway_tool_executions_total
```

## Namespaces & Tools

### Application Namespace (`app.*`)

- **Primary Priority**: Always tried first
- **Local Execution**: Runs in-process or spawned
- **Direct Access**: Fastest response times
- **Examples**:
  - `app.optimize.lineup`
  - `app.data.player_pool`
  - `app.simulation.run`

### External Namespace (`ext.*`)

- **Fallback Priority**: Used when app tools unavailable/failing
- **Shim Execution**: External processes via stdio
- **Network Calls**: May involve API calls
- **Examples**:
  - `ext.brave.search`
  - `ext.github.search_code`
  - `ext.puppeteer.screenshot`

## Security & Access Control

### Policy Engine

- **Rule-Based**: Configurable allow/deny/fallback rules
- **Pattern Matching**: `*` wildcards for flexible policies
- **Priority System**: Higher numbers = higher priority
- **Context Aware**: Time-based, user-based conditions

### Rate Limiting

- **Per-Tool**: Individual tool limits
- **Per-Namespace**: Namespace-wide limits
- **Sliding Window**: Configurable window size
- **Redis-backed**: Distributed rate limiting

## Monitoring & Debugging

### Health Status

Returns comprehensive health information:

- Tool availability by namespace
- Process statuses
- Cache performance
- Error rates

### Evidence Collection

All operations logged to `._federation/evidence/`:

- Request/response pairs
- Execution times
- Error details
- Policy decisions

### Prometheus Metrics

Comprehensive metrics for:

- Request volume and latency
- Cache hit/miss rates
- Tool execution statistics
- Error monitoring and alerting

## Migration from Single MCP Server

### What Changed

- **Multiple Servers** → **Single Gateway Server**
- **Direct Tool Calls** → **Policy-Routed Calls**
- **No Caching** → **Redis-Backed Caching**
- **Basic Logging** → **Structured Audit Logs**
- **Manual Restart** → **Auto Health Recovery**

### Backward Compatibility

- **Same Tool Names**: Clientes see same namespace.tool format
- **Same MCP Interface**: Standard MCP protocol maintained
- **Configuration Migration**: Environment variable mapping provided

## Deployment Checklist

- [x] Gateway TypeScript modules created
- [x] Shim script executable
- [x] Claude Desktop config updated
- [x] Docker Compose with profiles
- [x] Environment configuration template
- [x] Federation evidence directory
- [x] Policy routing implemented
- [x] Lazy loading for external tools
- [x] Circuit breaker and retries
- [x] Health check endpoint
- [x] Prometheus metrics integration
- [x] Structured logging system
- [x] Redis caching integration
- [x] External tool containerization

## Benefits

1. **Improved Reliability**: Circuit breaker prevents cascading failures
2. **Better Performance**: Caching reduces duplicate requests
3. **Enhanced Monitoring**: Comprehensive metrics and health checking
4. **Flexible Routing**: Policy-based tool selection
5. **Scalability**: External tools run independently
6. **Security**: Rate limiting and access control
7. **Observability**: Structured logging and evidence collection

## Next Steps

1. **Testing**: Validate federation routing and health checks
2. **Monitoring**: Set up Grafana dashboards for metrics
3. **Scaling**: Add more external tool integrations
4. **Documentation**: Create user guides for configuration
5. **Security**: Implement authentication for external services

This implementation represents a significant architectural enhancement that provides enterprise-grade reliability, monitoring, and scalability for the DFS optimization system.
