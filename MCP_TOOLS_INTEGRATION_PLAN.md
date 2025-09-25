# 🚀 Free/Open-Source MCP Tools Integration Plan for DFS Optimizer

## 🎯 **TOP 3 SELECTED TOOLS**

### 1. **Filesystem MCP + SQLite** (Port 3018)

**Enabled Features:**

- ✅ Lineup History Storage - persistent JSON/SQLite records of all optimizations
- ✅ Performance Tracking - win/loss rates, ROI by strategy
- ✅ Historical Analysis - compare lineup performance across dates
- ✅ Export/Import - backup optimization history, share successful strategies

**Resource Cost:** ~10MB RAM + 500MB storage
**Setup:** ✅ Already available, just needs schema creation
**Risks:** None - SQLite is battle-tested, zero external dependencies

---

### 2. **Puppeteer MCP** (Port 3017)

**Enabled Features:**

- ✅ UI Screenshot Testing - capture dashboard states before/after changes
- ✅ Visual Regression Detection - automated diff comparison of layouts
- ✅ Component Screenshots - individual tab snapshots for testing
- ✅ Automated UI Testing - validate optimizer workflow end-to-end

**Resource Cost:** ~50MB RAM + Chrome browser overhead
**Setup:** ✅ Already available, just needs test scenarios
**Risks:** Browser dependency, but contained in Docker

---

### 3. **Memory MCP Enhanced** (Port 3019)

**Enabled Features:**

- ✅ User Analytics - track which tabs used most, optimization patterns
- ✅ Session Management - maintain user preferences, recent lineups
- ✅ A/B Testing - compare different UI layouts, optimization strategies
- ✅ Real-time Metrics - dashboard usage stats, API response times

**Resource Cost:** ~20MB RAM (in-memory only)
**Setup:** ✅ Already available, needs custom analytics endpoints
**Risks:** Data lost on restart (by design for session data)

---

## 📊 **INTEGRATION ARCHITECTURE**

### Backend API Extensions (apps/api-python/simple_main.py)

```python
# New endpoints to add:

@app.post("/api/history/lineup")
async def save_lineup_history(request: Dict[str, Any]):
    """Save completed lineup to history via Filesystem MCP"""
    # Use filesystem MCP to store JSON records

@app.get("/api/history/lineups")
async def get_lineup_history(limit: int = 50):
    """Retrieve lineup history via Filesystem MCP"""

@app.post("/api/analytics/event")
async def track_analytics_event(request: Dict[str, Any]):
    """Store analytics event via Memory MCP"""

@app.get("/api/testing/screenshot/{component}")
async def take_component_screenshot(component: str):
    """Generate UI screenshot via Puppeteer MCP"""
```

### Frontend Integration (apps/web/src/services/)

```typescript
// New service files to create:

// mcp-history.service.ts - Filesystem MCP integration
export const saveLineupToHistory = (lineup: LineupResult) => { ... }
export const getLineupHistory = (filters: HistoryFilters) => { ... }

// mcp-analytics.service.ts - Memory MCP integration
export const trackUserAction = (action: string, data: any) => { ... }
export const getDashboardAnalytics = () => { ... }

// mcp-testing.service.ts - Puppeteer MCP integration
export const takeUISnapshot = (component: string) => { ... }
export const compareUISnapshots = (before: string, after: string) => { ... }
```

### Component Enhancements

**LineupHistory Component** → Connect to Filesystem MCP
**DashboardAnalytics Component** → Connect to Memory MCP  
**UITestRunner Component** → Connect to Puppeteer MCP

---

## 🔌 **MCP SERVER CONFIGURATION**

Static Port Assignments (already configured):

- **Filesystem MCP**: localhost:3018 - lineup history storage
- **Puppeteer MCP**: localhost:3017 - UI screenshots & testing
- **Memory MCP**: localhost:3019 - analytics & session data

Total Resource Overhead: **~80MB RAM + 500MB storage**
Maintenance Overhead: **Minimal** - all servers already running

---

## 🚀 **IMPLEMENTATION PHASES**

### Phase 1: Lineup History (Week 1)

- Create SQLite schema for lineup tracking
- Connect existing LineupHistory component to Filesystem MCP
- Add history API endpoints to backend

### Phase 2: Visual Regression (Week 2)

- Set up Puppeteer MCP screenshot endpoints
- Create baseline screenshots of all dashboard views
- Implement automated visual diff comparison

### Phase 3: User Analytics (Week 3)

- Enhance Memory MCP with analytics tracking
- Add user behavior tracking to frontend components
- Create analytics dashboard showing usage patterns

**Result:** Advanced DFS system with history tracking, visual regression testing, and user analytics - all using lightweight, self-hosted, open-source tools with minimal maintenance overhead.
