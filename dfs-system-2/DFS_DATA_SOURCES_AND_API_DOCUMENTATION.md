# DFS Data Sources and API Documentation - Complete Analysis

## 🚨 **CRITICAL FINDINGS: API vs CSV Reality**

### **❌ LIVE APIs ARE LIMITED - INDUSTRY USES CSV WORKFLOW**

Based on comprehensive GitHub research and industry analysis:

1. **DraftKings does NOT have official public APIs**
2. **Most professional DFS tools use CSV data exports**
3. **Live APIs are either unofficial/unstable or don't exist**
4. **Industry standard is CSV import/export workflow**

---

## 📊 **CURRENT DFS DATA LANDSCAPE**

### **✅ WORKING DATA SOURCES (CSV-Based)**

#### **1. Awesemo.com - INDUSTRY STANDARD**
- **Status**: ✅ **PREMIUM SERVICE** - Most used by pros
- **Data**: Player projections, ownership predictions, boom/bust analysis
- **Format**: CSV export (requires paid subscription)
- **Usage**: Download CSV → Import to optimizer → Generate lineups → Export to DraftKings
- **Integration**: Used by NBA-DFS-Tools and most professional optimizers

#### **2. DraftKings Official Export**
- **Status**: ✅ **AVAILABLE** - Player salaries and contest data
- **Data**: Live salaries, player IDs, contest structures
- **Format**: CSV download from DraftKings contest pages
- **Usage**: Export from DK → Import to optimizer → Generate lineups → Import back to DK

#### **3. FanDuel Official Export**
- **Status**: ✅ **AVAILABLE** - Similar to DraftKings
- **Data**: Player data, salaries, contest info
- **Format**: CSV export/import
- **Usage**: Standard CSV round-trip workflow

### **❌ LIVE API REALITY CHECK**

#### **Unofficial DraftKings APIs**
- **jaebradley/draftkings_client**: Uses unofficial endpoints (may break anytime)
- **Most GitHub repos**: Either outdated or use screen scraping (ToS violations)
- **Rate limiting**: Heavy restrictions on unofficial endpoints
- **Reliability**: No guarantees from DraftKings

---

## 🛠️ **PROFESSIONAL DFS WORKFLOW**

### **✅ INDUSTRY-STANDARD PROCESS**

```
1. Download Data
   ├── DraftKings: Export player_ids.csv
   ├── Awesemo: Download projections.csv, ownership.csv
   └── Weather/Vegas: Manual data entry or APIs

2. Import to Optimizer
   ├── Load CSV files
   ├── Apply constraints (locks/bans)
   └── Set optimization parameters

3. Generate Lineups
   ├── Run MIP optimization (OR-Tools/PuLP)
   ├── Apply uniqueness constraints
   └── Generate 20-150 lineups

4. Export Results
   ├── Format for DraftKings CSV
   ├── Include Entry IDs and Contest Names
   └── Upload to DraftKings contest
```

---

## 📥 **DraftKings CSV Export Format**

### **✅ PROPER DRAFTKINGS EXPORT FORMAT**

```csv
Entry ID,Contest Name,QB,RB1,RB2,WR1,WR2,WR3,TE,FLEX,DST
entry_1,NFL Main Slate,Josh Allen (10816),Saquon Barkley (11675),Travis Etienne (11832),CeeDee Lamb (11223),Amon-Ra St. Brown (11952),DJ Moore (10819),Travis Kelce (10847),Kenneth Walker III (11770),Bills (11891)
```

**Key Requirements:**
- **Player Format**: `Player Name (DraftKings ID)`
- **Positions**: QB, RB1, RB2, WR1, WR2, WR3, TE, FLEX, DST
- **Entry ID**: Unique identifier for each lineup
- **Contest Name**: Target contest (must match DK contest exactly)

---

## 🔧 **OPTIMIZER TROUBLESHOOTING**

### **❌ CURRENT ISSUE: Backend Not Running**

**Problem**: Docker container not accessible on ports 8000/8765
**Root Cause**: Missing dependencies or startup failures

**Solution**:
```bash
# Check container status
docker ps -a | grep dfs

# Check logs
docker logs dfs-ultimate-optimizer

# Restart with debug
cd dfs-system-2
docker compose down
docker compose up --build
```

### **✅ OPTIMIZER ALTERNATIVES**

Since live optimization may not work, implement **client-side optimization**:

```javascript
// Simple client-side lineup generation
function generateBasicLineups() {
    const lineups = [];
    
    // Sort players by value
    const sortedPlayers = currentPlayers
        .filter(p => !bannedPlayers.has(p.name))
        .sort((a, b) => b.value - a.value);
    
    // Generate lineup using greedy approach
    for (let i = 0; i < numLineups; i++) {
        const lineup = buildLineup(sortedPlayers, lockedPlayers);
        lineups.push(lineup);
    }
    
    return lineups;
}
```

---

## 📊 **DATA SOURCE RECOMMENDATIONS**

### **✅ IMMEDIATE SOLUTIONS**

#### **Option 1: Professional CSV Workflow**
1. **Download from DraftKings**: Player salaries and IDs
2. **Get Projections**: Awesemo.com premium service ($30/month)
3. **Import to System**: CSV upload functionality
4. **Generate Lineups**: Local optimization
5. **Export to DraftKings**: Proper CSV format

#### **Option 2: Free Data Sources**
1. **FantasyPros**: Free consensus projections
2. **ESPN API**: Basic player stats
3. **NFL.com**: Injury reports and news
4. **Manual Entry**: For small slates

#### **Option 3: Hybrid Approach**
1. **Use current 220-player database** (already working)
2. **Update projections manually** for key games
3. **Focus on optimization engine** rather than data collection
4. **Export lineups** in proper DraftKings format

---

## 🎯 **NEXT STEPS TO FIX SYSTEM**

### **Priority 1: Fix Optimizer Backend**
```bash
# Start local Python servers
cd dfs-system-2
source venv/bin/activate
python live_optimizer_api.py &
python draftkings_api_server.py &
```

### **Priority 2: Implement Client-Side Optimization**
- Add JavaScript-based lineup generation
- Use current 220-player pool
- Apply salary cap and position constraints
- Generate valid DraftKings lineups

### **Priority 3: Perfect CSV Export**
- Implement exact DraftKings CSV format
- Include proper player IDs and contest names
- Test upload back to DraftKings

### **Priority 4: Tab Validation**
- Test each tab individually
- Fix any broken functionality
- Ensure all buttons and features work

---

## 💡 **PROFESSIONAL INSIGHT**

**The DFS industry reality:**
- **No one uses live APIs** for day-to-day optimization
- **CSV workflow is the professional standard**
- **Awesemo.com dominates** the projection market
- **Tools focus on optimization** rather than data collection
- **Manual updates** are common for key information

**Your system is architecturally correct** - the issue is expectations about live APIs that don't really exist in the professional DFS world.
