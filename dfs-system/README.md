# DFS System

## Overview
The DFS System is a production-grade application designed to ingest multi-source data, merge it into unified schemas, apply AI-assisted projection fusion, run Monte Carlo simulations, and solve lineups using Mixed Integer Programming (MIP) optimization for DraftKings and FanDuel. This project aims to provide a comprehensive solution for daily fantasy sports (DFS) players and analysts.

## Features
- **Data Ingestion**: Import salary data from CSV files for DraftKings and FanDuel, with automatic column detection and slate time validation.
- **Unified Schemas**: Utilize Pydantic models to ensure data integrity and validation across various data sources.
- **AI Projection Fusion**: Implement ensemble methods and learning-to-rank algorithms to combine multiple projection sources into a unified output.
- **Monte Carlo Simulations**: Evaluate player performance and lineup viability through advanced simulation techniques, considering player correlations and contextual factors.
- **MIP Optimization**: Generate optimal lineups based on defined constraints and objectives, maximizing projected points or expected value.
- **CSV Export**: Export generated lineups and projections to CSV format, ready for upload to DraftKings and FanDuel.
- **Web UI**: A simple web interface for uploading CSVs, selecting slates, and displaying generated lineups with projections and metrics.

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd dfs-system
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage
1. Start the web application:
   ```
   python src/web/app.py
   ```

2. Access the web UI in your browser at `http://localhost:8000`.

3. Use the interface to upload CSV files, select slates, and view generated lineups.

## Data Sources
- Salary data for DraftKings and FanDuel in CSV format.
- Player projections from various sources, which can be integrated into the system.

## Configuration
Configuration settings can be managed through environment variables or a configuration file. Ensure to set up the necessary API keys and other configurations as required by the project.

## Testing
Run the unit tests to ensure the integrity of the modules:
```
pytest tests/
```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.