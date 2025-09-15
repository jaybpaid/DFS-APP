# 🚀 DFS Ultimate Optimizer - Quick Start Guide

## 🎯 One-Click Launch (Recommended)

The easiest way to get started:

```bash
# 1. Install dependencies (OR-Tools may take time, but system works without it)
pip install -r requirements.txt

# 2. Test everything works (will use PuLP fallback if OR-Tools isn't ready)
python test_services.py

# 3. Launch everything automatically
python launch_all.py
```

That's it! All services will start and your dashboard will open automatically.

## 📋 Manual Setup (Alternative)

If you prefer to start services individually:

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start DraftKings API Server
```bash
python draftkings_api_server.py
```
*Runs on http://localhost:8765*

### Step 3: Start FastAPI Optimizer
```bash
python live_optimizer_api.py
```
*Runs on http://localhost:8000*

### Step 4: Open Dashboard
Open `dfs_ultimate_optimizer_with_live_data.html` in your browser.

## 🔧 Troubleshooting

### Services Won't Start
Run the test script to diagnose issues:
```bash
python test_services.py
```

Common fixes:
- **Missing dependencies**: `pip install -r requirements.txt`
- **Python version**: Requires Python 3.8+
- **Port conflicts**: Check if ports 8000/8765 are available

### Dashboard Won't Load
- Make sure both API servers are running
- Check browser console for CORS errors
- Try refreshing the page

### Live Data Not Working
- Check DraftKings API server logs
- Verify internet connection
- Some features may be rate-limited

## 🎮 How to Use

### 1. Load Live Data
Click "Load Live DraftKings Data" - this fetches real salaries and generates optimized lineups automatically.

### 2. Review Lineups
- View 20 optimized lineups with projections
- See win rates, ROI, and Sharpe ratios
- Check player correlations and diversity scores

### 3. Late Swaps (Advanced)
- Lock your favorite players
- Get AI recommendations for replacements
- See salary impact and projection changes

### 4. Run Simulations
- Monte Carlo analysis with 50K+ simulations
- Tournament win probability estimates
- ROI projections for different field sizes

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HTML Dashboard│────│  FastAPI Optimizer │────│ DraftKings API  │
│   (Port 80)     │    │   (Port 8000)     │    │  (Port 8765)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┴────────────────────────┘
                          Live Data Flow
```

- **HTML Dashboard**: Beautiful UI with real-time updates
- **FastAPI Optimizer**: MIP optimization engine with live data
- **DraftKings API**: Real-time salary and contest data

## 📊 Key Features

✅ **Real DraftKings Data** - Live salary integration
✅ **MIP Optimization** - Professional lineup generation
✅ **Late Swap Engine** - AI-powered player replacements
✅ **Monte Carlo Simulation** - 50K+ performance simulations
✅ **AI Strategy Analysis** - Multi-provider insights
✅ **Portfolio Optimization** - Kelly betting and risk management
✅ **Advanced Analytics** - Sharpe ratios, correlations, diversity scores

## 🎯 Performance Tips

- **Large Tournaments**: Use "Large (100K+)" field size for better optimization
- **Cash Games**: Switch to "Cash Game" contest type
- **Late Swaps**: Lock 2-3 key players, let AI find optimal replacements
- **Simulation**: Run simulations to find lineups with best risk-adjusted returns

## 🔒 Production Deployment

For production use:

1. **Environment Variables**: Set up `.env` file with API keys
2. **Reverse Proxy**: Use nginx to serve the HTML dashboard
3. **Process Manager**: Use systemd/pm2 to manage services
4. **Monitoring**: Add logging and health checks
5. **Scaling**: Deploy API services on separate instances

## 🆘 Support

If you encounter issues:

1. Run `python test_services.py` to diagnose problems
2. Check the console output for error messages
3. Verify all dependencies are installed
4. Make sure ports 8000 and 8765 are available

## 🎉 You're Ready!

Your professional DFS optimization system is now ready. Click "Load Live DraftKings Data" and start optimizing like a pro! 🚀
