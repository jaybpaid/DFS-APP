# DFS Optimization System

A production-grade Daily Fantasy Sports (DFS) optimization system that ingests multi-source data, applies AI-assisted projection fusion, runs Monte Carlo simulations, and solves lineups using Mixed Integer Programming (MIP) optimization for DraftKings and FanDuel.

## 🏆 Features

### Core Capabilities

- **Multi-Source Data Ingestion**: Automated data collection from NFL and NBA sources with ToS compliance
- **AI-Assisted Projections**: Ensemble modeling with learning-to-rank fusion
- **Monte Carlo Simulation**: Advanced risk assessment with player correlations
- **MIP Optimization**: Constraint-based lineup generation with OR-Tools
- **CSV Import/Export**: Direct integration with DraftKings and FanDuel
- **Late Swap**: Re-optimization for locked players
- **Web UI**: Simple interface for lineup management
- **CLI Interface**: Full command-line automation

### Sports Supported

- **NFL**: DraftKings and FanDuel formats
- **NBA**: DraftKings and FanDuel formats

### Data Sources (ToS Compliant)

- **NFL**: nflfastR, TheOddsAPI, OpenWeatherMap, Official injury reports
- **NBA**: Ball Don't Lie API, NBA API, TheOddsAPI, Official injury reports

## 🚀 Quick Start

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd dfs-system-2
```

2. **Install dependencies**

```bash
pip install -r requirements.txt
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your API keys
```

### Basic Usage

#### Import Salary Data

```bash
python -m src.cli import-salaries tests/fixtures/dk_nfl_sample.csv --output players.json
```

#### Run Full Demo

```bash
# NFL Demo (DraftKings)
python -m src.cli demo --sport NFL

# NBA Demo (FanDuel)
python -m src.cli demo --sport NBA
```

#### Generate Optimal Lineups

```bash
python -m src.cli optimize --sport NFL --site DraftKings --n 10 --salary-file tests/fixtures/dk_nfl_sample.csv --output lineups.csv
```

## 📁 Project Structure

```
dfs-system-2/
├── README.md                  # This file
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── src/
│   ├── config/               # Configuration files
│   │   ├── sources.json      # Data source configurations
│   │   ├── weights.json      # AI fusion weights
│   │   └── rules/            # DFS site rules
│   │       ├── dk_nfl.json   # DraftKings NFL rules
│   │       ├── fd_nfl.json   # FanDuel NFL rules
│   │       ├── dk_nba.json   # DraftKings NBA rules
│   │       └── fd_nba.json   # FanDuel NBA rules
│   ├── data/
│   │   └── schemas.py        # Pydantic data models
│   ├── ingest/               # Data ingestion
│   │   ├── base.py           # Base ingestion framework
│   │   ├── nfl/              # NFL-specific ingestors
│   │   │   ├── nflfastr.py   # nflfastR play-by-play data
│   │   │   ├── odds.py       # TheOddsAPI betting lines
│   │   │   └── weather.py    # OpenWeatherMap data
│   │   └── nba/              # NBA-specific ingestors
│   ├── features/             # Feature engineering
│   ├── models/               # AI/ML models
│   ├── optimize/             # Optimization engine
│   │   └── mip_solver.py     # OR-Tools MIP solver
│   ├── io/                   # Import/Export
│   │   └── csv_import_export.py # CSV handling
│   ├── ui/                   # Web interface
│   └── cli.py                # Command-line interface
├── tests/
│   └── fixtures/             # Test data
│       ├── dk_nfl_sample.csv # Sample DK NFL data
│       └── fd_nba_sample.csv # Sample FD NBA data
└── .cache/                   # Cached data (created at runtime)
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file from the template:

```bash
# API Keys
ODDS_API_KEY=your_odds_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Scraping Control
ALLOW_SCRAPE=false

# Cache Configuration
CACHE_DIR=.cache
TTL_ODDS_MIN=15
TTL_WEATHER_MIN=20
TTL_INJURIES_MIN=20
TTL_CORE_HOURS=24

# Simulation Settings
SIM_SEED=1337
```

### Data Sources

Configure data sources in `src/config/sources.json`:

```json
{
  "NFL": {
    "core": {
      "nflfastr": {
        "enabled": true,
        "url": "https://github.com/nflverse/nfldata/releases/latest/download/play_by_play_{year}.parquet",
        "ttl_hours": 24,
        "tos_compliant": true
      }
    },
    "vegas": {
      "theoddsapi": {
        "enabled": true,
        "url": "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds",
        "ttl_minutes": 15,
        "requires_api_key": true
      }
    }
  }
}
```

## 🎯 Usage Examples

### CLI Commands

#### Data Ingestion

```bash
# Ingest all enabled sources for NFL
python -m src.cli ingest --sport NFL

# Force refresh cached data
python -m src.cli ingest --sport NFL --force-refresh
```

#### Projections

```bash
# Generate ensemble projections
python -m src.cli project --sport NFL --method ensemble

# ML-only projections
python -m src.cli project --sport NBA --method ml-only
```

#### Simulations

```bash
# Run 20,000 Monte Carlo simulations
python -m src.cli simulate --sport NFL --sims 20000

# Simulate specific lineups
python -m src.cli simulate --sport NBA --lineup-file lineups.json --sims 10000
```

#### Optimization

```bash
# Basic optimization
python -m src.cli optimize --sport NFL --site DraftKings --n 50

# Advanced constraints
python -m src.cli optimize \
  --sport NFL \
  --site DraftKings \
  --n 150 \
  --objective ev \
  --exposure "player123:0.35" \
  --lock "qb456,wr789" \
  --salary-file salaries.csv
```

#### Late Swap

```bash
# Re-optimize with locked players
python -m src.cli late-swap \
  --sport NFL \
  --site DraftKings \
  --lineup-file lineups.csv \
  --lock-file locked_players.json
```

#### Export

```bash
# Export for DraftKings upload
python -m src.cli export \
  --site DraftKings \
  --lineup-file lineups.json \
  --out dk_upload.csv \
  --include-projections \
  --include-ownership
```

## 🏗️ Architecture

### Data Flow

1. **Ingestion**: Multi-source data collection with caching and rate limiting
2. **Normalization**: Team names, player names, and positions standardized
3. **Feature Engineering**: Advanced metrics and contextual data
4. **AI Fusion**: Ensemble projections with learning-to-rank
5. **Simulation**: Monte Carlo with player correlations
6. **Optimization**: MIP-based lineup generation
7. **Export**: DFS-ready CSV files

### Key Components

#### MIP Optimizer (`src/optimize/mip_solver.py`)

- Uses OR-Tools SCIP solver
- Handles complex constraints (salary cap, positions, exposures)
- Supports stacking and diversification
- Multi-lineup generation with overlap control

#### Data Ingestion (`src/ingest/`)

- Modular source-specific ingestors
- Automatic caching with TTL
- Rate limiting and retry logic
- ToS compliance checking

#### CSV Import/Export (`src/io/csv_import_export.py`)

- Auto-detection of site and sport
- Robust column mapping
- Export formatting for DK/FD upload

## 🧪 Testing

### Fixtures

Sample data files are provided for testing:

- `tests/fixtures/dk_nfl_sample.csv` - DraftKings NFL sample
- `tests/fixtures/fd_nba_sample.csv` - FanDuel NBA sample

### Running Tests

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_optimization.py

# Run with coverage
pytest --cov=src tests/
```

## 📊 AI & Machine Learning

### Projection Fusion

The system uses ensemble methods to combine multiple projection sources:

1. **Baseline Models**: Rule-based projections from historical data
2. **ML Models**: XGBoost and linear regression on engineered features
3. **Meta-Learning**: Learning-to-rank for optimal weight assignment

### Feature Engineering

Advanced features include:

- **NFL**: Snap share, air yards, red zone usage, weather impact, DvP
- **NBA**: Usage rate, pace adjustments, rest, back-to-back games

### Monte Carlo Simulation

Player correlations account for:

- **NFL**: QB-WR stacks, game environment, weather
- **NBA**: Pace correlations, blowout scenarios, rotation overlaps

## 🔒 Terms of Service Compliance

The system is designed with ToS compliance as a priority:

- **Configurable Sources**: Enable/disable sources per ToS requirements
- **Rate Limiting**: Respects API rate limits automatically
- **Caching**: Reduces API calls with intelligent TTL
- **Attribution**: Logs all data sources used
- **Compliance Checking**: Built-in ToS validation

### Approved Data Sources

- ✅ nflfastR (Open source, MIT license)
- ✅ TheOddsAPI (Free tier available)
- ✅ OpenWeatherMap (Free tier available)
- ✅ Ball Don't Lie (Free NBA API)
- ✅ Official injury reports (Public information)

## 🚀 Production Deployment

### Performance Optimization

- **Caching**: Parquet-based caching with compression
- **Parallel Processing**: Multi-threaded data ingestion
- **Memory Efficient**: Streaming data processing
- **Solver Optimization**: SCIP with custom parameters

### Monitoring

- **Pipeline Status**: Track ingestion success/failure
- **Cache Hit Rates**: Monitor data freshness
- **Optimization Metrics**: Solver performance tracking
- **Export Validation**: Lineup constraint checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`pytest`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational and research purposes. Users are responsible for:

- Complying with all applicable laws and regulations
- Respecting Terms of Service of data providers
- Understanding the risks of daily fantasy sports
- Using the software responsibly

The authors are not responsible for any financial losses or legal issues arising from the use of this software.

## 🎯 Roadmap

### Upcoming Features

- [ ] Advanced stacking strategies
- [ ] Ownership prediction models
- [ ] Real-time late swap automation
- [ ] Portfolio optimization across slates
- [ ] Mobile-responsive web UI
- [ ] Docker containerization
- [ ] Cloud deployment guides

### Data Source Expansion

- [ ] Additional NBA advanced metrics
- [ ] MLB support
- [ ] NHL support
- [ ] Player prop integration
- [ ] Social media sentiment analysis

## 🔗 Resources

- [OR-Tools Documentation](https://developers.google.com/optimization)
- [nflfastR Data Dictionary](https://www.nflfastr.com/articles/nflfastR.html)
- [TheOddsAPI Documentation](https://the-odds-api.com/liveapi/guides/v4)
- [DraftKings CSV Format](https://www.draftkings.com/)
- [FanDuel CSV Format](https://www.fanduel.com/)

---

**Built with ❤️ for the DFS community**
