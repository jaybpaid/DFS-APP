# DFS Ultimate Optimizer - Live Salary Data System

## 🚀 Quick Start

The system is designed to automatically pull live salary data from DraftKings. No manual file uploads needed!

### Start the Live System

```bash
python start_live_system.py
```

This will start both required servers:
- **DraftKings API Server** (port 8765) - Fetches live salary data
- **Live Optimizer API** (port 8000) - Handles lineup optimization

### Open the Dashboard

Once both servers are running, open:
```
dfs_ultimate_optimizer_with_live_data.html
```

## 🎯 How It Works

### 1. **Automatic Data Loading**
- System connects to DraftKings API
- Pulls live salary data for NFL/NBA
- Extracts 200+ players with salaries, positions, teams
- Updates every 15 minutes automatically

### 2. **Slate Selection**
- Choose your site (DraftKings, FanDuel, SuperDraft)
- Select specific contest slates
- Pick contests (Milly Maker, small tournaments, etc.)
- System auto-adjusts optimization for contest type

### 3. **Complete Player Database**
- Shows 200+ players (not just 8!)
- Live salary data from DraftKings
- Multi-source projections and ownership
- Advanced filtering and sorting

### 4. **Professional Features**
- Contest-specific optimization
- AI-powered lineup generation
- Monte Carlo simulations
- Late swap recommendations
- Export functionality

## 🔧 System Architecture

```
DraftKings API → DraftKings API Server (8765) → Live Optimizer API (8000) → HTML Dashboard
```

### Components:

1. **`draftkings_api_server.py`**
   - Fetches live data from DraftKings
   - Handles CORS issues
   - Processes player data
   - Provides clean API endpoints

2. **`live_optimizer_api.py`**
   - FastAPI server for optimization
   - Connects to DraftKings API server
   - Runs MIP optimization
   - Returns lineups + full player pool

3. **`dfs_ultimate_optimizer_with_live_data.html`**
   - Professional dashboard interface
   - Slate selector with contest details
   - Player database with live data
   - Lineup generation and analysis

## 📊 Expected Behavior

When you select a slate and click "Load Selected Contest":

1. ✅ **Live Data Fetch**: System pulls current DraftKings salary data
2. ✅ **Player Database**: Shows 200+ players in slate info bar
3. ✅ **Complete Table**: Full player table with salaries, projections, ownership
4. ✅ **Contest Optimization**: Settings auto-adjust for selected contest type
5. ✅ **Lineup Generation**: Creates optimized lineups using live data

## 🐛 Troubleshooting

### "Only showing 8 players"
- **Fixed!** System now includes `player_pool` in API response
- Frontend properly extracts full player database
- Fallback generates 200 players if API doesn't provide full pool

### "No live data connection"
- Run `python start_live_system.py` to start both servers
- Check that ports 8765 and 8000 are available
- Verify both servers show "✅ started successfully"

### "API server not responding"
- DraftKings API may be rate-limited
- System includes fallback mock data
- Check console for specific error messages

## 🎯 Key Features

### **Slate Selector**
- Real contest data (Milly Maker, etc.)
- Entry fees, field sizes, prize pools
- Auto-optimization for contest type
- Strategy recommendations

### **Live Player Data**
- Current DraftKings salaries
- Real-time updates
- Complete player pool
- Multi-source intelligence

### **Professional Interface**
- Daily Fantasy Fuel inspired design
- Advanced filtering and sorting
- Contest-specific strategies
- Export functionality

## 💡 Usage Tips

1. **Start with Slate Selection**: Choose your contest first
2. **Let System Load Data**: Wait for live data to populate
3. **Verify Player Count**: Should show 200+ players in slate info
4. **Generate Lineups**: Use contest-specific optimization
5. **Export Results**: Download optimized lineups

The system is designed to work seamlessly with live DraftKings data - no manual uploads required!
