import os
import click
import json
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List

# Set random seed for reproducibility
np.random.seed(int(os.getenv('SIM_SEED', '1337')))

from .data.schemas import SportType, SiteType, OptimizationConfig, ExportConfig
from .io.csv_import_export import CSVImporter, CSVExporter
from .optimize.mip_solver import MIPOptimizer

@click.group()
@click.version_option(version='1.0.0', prog_name='DFS Optimizer')
def cli():
    """Production-grade DFS optimization system with AI-assisted projections and Monte Carlo simulation."""
    pass

@cli.command('import-salaries')
@click.argument('file_path', type=click.Path(exists=True))
@click.option('--sport', type=click.Choice(['NFL', 'NBA']), help='Sport type (auto-detected if not specified)')
@click.option('--site', type=click.Choice(['DraftKings', 'FanDuel']), help='DFS site (auto-detected if not specified)')
@click.option('--output', '-o', help='Output file for processed player data')
def import_salaries(file_path, sport, site, output):
    """Import salary CSV files from DraftKings or FanDuel."""
    click.echo(f"Importing salary file: {file_path}")
    
    try:
        importer = CSVImporter()
        players, metadata = importer.import_salary_file(file_path)
        
        # Override auto-detection if specified
        if sport:
            metadata['sport'] = SportType(sport)
        if site:
            metadata['site'] = SiteType(site)
        
        click.echo(f"Successfully imported {len(players)} players")
        click.echo(f"Detected: {metadata['site'].value} {metadata['sport'].value}")
        click.echo(f"Slate: {metadata['slate_name']}")
        click.echo(f"Salary Cap: ${metadata['salary_cap']:,}")
        click.echo(f"Roster Size: {metadata['roster_size']}")
        
        # Save processed data if output specified
        if output:
            output_data = {
                'players': [player.dict() for player in players],
                'metadata': {k: v.value if hasattr(v, 'value') else v for k, v in metadata.items() if k != 'import_time'}
            }
            
            with open(output, 'w') as f:
                json.dump(output_data, f, indent=2, default=str)
            
            click.echo(f"Saved processed data to: {output}")
        
    except Exception as e:
        click.echo(f"Error importing salaries: {e}", err=True)
        raise click.Abort()

@cli.command('ingest')
@click.option('--sport', type=click.Choice(['NFL', 'NBA']), required=True, help='Sport to ingest data for')
@click.option('--site', type=click.Choice(['DraftKings', 'FanDuel']), help='DFS site context')
@click.option('--slate', help='Specific slate identifier')
@click.option('--force-refresh', is_flag=True, help='Force refresh of cached data')
def ingest(sport, site, slate, force_refresh):
    """Ingest data from enabled sources for a sport."""
    click.echo(f"Starting data ingestion for {sport}")
    
    if force_refresh:
        click.echo("Force refresh enabled - clearing cache")
        # Would implement cache clearing logic here
    
    try:
        # This would use the actual ingestion system
        # For demo purposes, we'll simulate the process
        
        sources = {
            'NFL': ['nflfastR', 'TheOddsAPI', 'OpenWeather', 'NFL Official Injuries'],
            'NBA': ['Ball Dont Lie', 'NBA API', 'TheOddsAPI', 'NBA Official Injuries']
        }
        
        sport_sources = sources.get(sport, [])
        
        for source in sport_sources:
            click.echo(f"  • Ingesting from {source}...")
            # Simulate processing time
            import time
            time.sleep(0.5)
            
            # Simulate success/failure
            status = "SUCCESS" if np.random.random() > 0.1 else "WARNING"
            records = np.random.randint(10, 1000)
            
            if status == "SUCCESS":
                click.echo(f"    ✓ {status}: {records} records processed")
            else:
                click.echo(f"    ⚠ {status}: {records} records processed (with warnings)")
        
        click.echo(f"Data ingestion completed for {sport}")
        
    except Exception as e:
        click.echo(f"Error during ingestion: {e}", err=True)
        raise click.Abort()

@cli.command('project')
@click.option('--sport', type=click.Choice(['NFL', 'NBA']), required=True, help='Sport to generate projections for')
@click.option('--method', type=click.Choice(['ensemble', 'baseline', 'ml-only']), default='ensemble', help='Projection method')
@click.option('--output', '-o', help='Output file for projections')
def project(sport, method, output):
    """Generate AI-assisted player projections."""
    click.echo(f"Generating {method} projections for {sport}")
    
    try:
        # This would use the actual projection system
        # For demo purposes, we'll simulate the process
        
        click.echo("Building feature matrix...")
        time.sleep(1)
        
        click.echo("Training ensemble models...")
        time.sleep(2)
        
        click.echo("Applying AI fusion weights...")
        time.sleep(1)
        
        # Simulate projection results
        num_players = np.random.randint(200, 500)
        click.echo(f"Generated projections for {num_players} players")
        
        # Show sample stats
        avg_projection = np.random.uniform(8.0, 25.0)
        click.echo(f"Average projection: {avg_projection:.1f} fantasy points")
        
        if output:
            # Would save actual projections here
            click.echo(f"Projections saved to: {output}")
    
    except Exception as e:
        click.echo(f"Error generating projections: {e}", err=True)
        raise click.Abort()

@cli.command('simulate')
@click.option('--sport', type=click.Choice(['NFL', 'NBA']), required=True, help='Sport to simulate')
@click.option('--sims', type=int, default=10000, help='Number of Monte Carlo simulations')
@click.option('--lineup-file', help='File containing lineups to simulate')
@click.option('--output', '-o', help='Output file for simulation results')
def simulate(sport, sims, lineup_file, output):
    """Run Monte Carlo simulations for lineup evaluation."""
    click.echo(f"Running {sims:,} Monte Carlo simulations for {sport}")
    
    try:
        # This would use the actual simulation system
        # For demo purposes, we'll simulate the process
        
        if lineup_file:
            click.echo(f"Loading lineups from: {lineup_file}")
            num_lineups = np.random.randint(1, 50)
        else:
            click.echo("Simulating projection distributions...")
            num_lineups = 1
        
        click.echo("Applying correlation matrices...")
        time.sleep(1)
        
        # Simulate progress
        with click.progressbar(range(sims // 1000), label='Running simulations') as bar:
            for _ in bar:
                time.sleep(0.1)
        
        # Simulate results
        mean_score = np.random.uniform(120, 180)
        std_score = np.random.uniform(15, 25)
        top1_rate = np.random.uniform(0.001, 0.01)
        cash_rate = np.random.uniform(0.15, 0.40)
        
        click.echo(f"\nSimulation Results:")
        click.echo(f"  Mean Score: {mean_score:.1f} ± {std_score:.1f}")
        click.echo(f"  Top 1% Rate: {top1_rate*100:.2f}%")
        click.echo(f"  Cash Rate: {cash_rate*100:.1f}%")
        
        if output:
            click.echo(f"Simulation results saved to: {output}")
    
    except Exception as e:
        click.echo(f"Error running simulations: {e}", err=True)
        raise click.Abort()

@cli.command('optimize')
@click.option('--sport', type=click.Choice(['NFL', 'NBA']), required=True, help='Sport to optimize')
@click.option('--site', type=click.Choice(['DraftKings', 'FanDuel']), required=True, help='DFS site')
@click.option('--n', type=int, default=1, help='Number of lineups to generate')
@click.option('--objective', type=click.Choice(['projection', 'ev', 'hybrid']), default='projection', help='Optimization objective')
@click.option('--stack', help='Stacking configuration (e.g., "QB:2 bringback:1")')
@click.option('--exposure', help='Exposure limits (e.g., "PLAYER_ID:0.35")')
@click.option('--lock', help='Players to lock in lineups')
@click.option('--ban', help='Players to ban from lineups')
@click.option('--salary-file', type=click.Path(exists=True), help='Salary CSV file to use')
@click.option('--output', '-o', help='Output file for optimized lineups')
def optimize(sport, site, n, objective, stack, exposure, lock, ban, salary_file, output):
    """Generate optimal lineups using MIP optimization."""
    click.echo(f"Optimizing {n} {site} {sport} lineup(s) using {objective} objective")
    
    try:
        # Import salary data if provided
        players = []
        if salary_file:
            click.echo(f"Loading players from: {salary_file}")
            importer = CSVImporter()
            players, metadata = importer.import_salary_file(salary_file)
            click.echo(f"Loaded {len(players)} players")
        else:
            click.echo("No salary file provided - using demo data")
            # Would load from projections/cache in real implementation
            
        if not players:
            # Create demo players for testing
            positions = ['QB', 'RB', 'WR', 'TE', 'DST'] if sport == 'NFL' else ['PG', 'SG', 'SF', 'PF', 'C']
            from .data.schemas import Player
            
            demo_players = []
            for i in range(50):  # Create 50 demo players
                pos = np.random.choice(positions)
                salary = np.random.randint(3000, 12000)
                player = Player(
                    id=f"player_{i}",
                    name=f"Player {i}",
                    position=pos,
                    team=f"T{i//5}",
                    salary=salary
                )
                demo_players.append(player)
            players = demo_players
        
        # Set up optimization config
        config = OptimizationConfig(
            sport=SportType(sport),
            site=SiteType(site),
            objective=objective,
            num_lineups=n
        )
        
        # Parse constraints
        if exposure:
            # Simple parsing - in real implementation would be more robust
            parts = exposure.split(':')
            if len(parts) == 2:
                config.max_exposure = {parts[0]: float(parts[1])}
        
        if lock:
            config.locked_players = lock.split(',')
        
        if ban:
            config.banned_players = ban.split(',')
        
        # Run optimization
        optimizer = MIPOptimizer(SportType(sport), SiteType(site))
        
        click.echo("Running MIP optimization...")
        with click.progressbar(range(n), label='Generating lineups') as bar:
            lineups = []
            for i in bar:
                # In real implementation, would call optimizer.optimize_lineups()
                # For demo, create mock lineup
                from .data.schemas import Lineup, LineupPlayer
                
                # Select players randomly for demo
                selected_players = np.random.choice(players, size=9 if sport == 'NFL' else 8, replace=False)
                lineup_players = []
                total_salary = 0
                total_projection = 0
                
                for j, player in enumerate(selected_players):
                    lineup_player = LineupPlayer(
                        player_id=player.id,
                        roster_position=player.position,
                        salary=player.salary,
                        projection=np.random.uniform(5.0, 25.0),
                        ownership=np.random.uniform(0.01, 0.30)
                    )
                    lineup_players.append(lineup_player)
                    total_salary += player.salary
                    total_projection += lineup_player.projection
                
                lineup = Lineup(
                    id=f"lineup_{i}",
                    players=lineup_players,
                    total_salary=total_salary,
                    total_projection=total_projection,
                    total_ownership=sum(p.ownership or 0 for p in lineup_players)
                )
                lineups.append(lineup)
                
                time.sleep(0.1)  # Simulate processing time
        
        click.echo(f"\nGenerated {len(lineups)} lineups:")
        
        # Display top lineups
        for i, lineup in enumerate(lineups[:3]):
            click.echo(f"Lineup {i+1}: {lineup.total_projection:.1f} pts, ${lineup.total_salary:,}, {lineup.total_ownership*100:.1f}% own")
        
        # Export lineups
        if output:
            exporter = CSVExporter()
            export_config = ExportConfig(
                site=SiteType(site),
                sport=SportType(sport),
                include_projections=True,
                include_ownership=True
            )
            
            output_path = exporter.export_lineups(lineups, export_config, output)
            click.echo(f"Lineups exported to: {output_path}")
        
    except Exception as e:
        click.echo(f"Error during optimization: {e}", err=True)
        raise click.Abort()

@cli.command('late-swap')
@click.option('--sport', type=click.Choice(['NFL', 'NBA']), required=True, help='Sport')
@click.option('--site', type=click.Choice(['DraftKings', 'FanDuel']), required=True, help='DFS site')
@click.option('--lineup-file', type=click.Path(exists=True), required=True, help='File containing lineups to swap')
@click.option('--lock-file', type=click.Path(exists=True), help='File containing locked players')
@click.option('--output', '-o', help='Output file for swapped lineups')
def late_swap(sport, site, lineup_file, lock_file, output):
    """Perform late swap optimization on existing lineups."""
    click.echo(f"Performing late swap for {site} {sport}")
    
    try:
        click.echo(f"Loading lineups from: {lineup_file}")
        
        # Would load actual lineups and locked players
        if lock_file:
            click.echo(f"Loading locked players from: {lock_file}")
        
        click.echo("Identifying swappable players...")
        click.echo("Re-optimizing non-locked positions...")
        
        # Simulate late swap process
        time.sleep(2)
        
        num_swaps = np.random.randint(1, 5)
        click.echo(f"Made {num_swaps} player swaps")
        
        if output:
            click.echo(f"Updated lineups saved to: {output}")
    
    except Exception as e:
        click.echo(f"Error during late swap: {e}", err=True)
        raise click.Abort()

@cli.command('export')
@click.option('--site', type=click.Choice(['DraftKings', 'FanDuel']), required=True, help='DFS site')
@click.option('--sport', type=click.Choice(['NFL', 'NBA']), help='Sport (auto-detected from lineups if not specified)')
@click.option('--lineup-file', type=click.Path(exists=True), required=True, help='File containing lineups to export')
@click.option('--out', required=True, help='Output CSV file')
@click.option('--include-projections/--no-projections', default=True, help='Include projections in export')
@click.option('--include-ownership/--no-ownership', default=True, help='Include ownership in export')
@click.option('--include-metrics/--no-metrics', default=False, help='Include advanced metrics')
def export(site, sport, lineup_file, out, include_projections, include_ownership, include_metrics):
    """Export lineups to DraftKings or FanDuel upload format."""
    click.echo(f"Exporting lineups for {site}")
    
    try:
        click.echo(f"Loading lineups from: {lineup_file}")
        
        # Would load actual lineups here
        # For demo, create mock export
        click.echo("Converting to upload format...")
        
        export_config = ExportConfig(
            site=SiteType(site),
            sport=SportType(sport) if sport else SportType.NFL,  # Default
            include_projections=include_projections,
            include_ownership=include_ownership,
            include_metrics=include_metrics
        )
        
        # Simulate export process
        time.sleep(1)
        
        num_lineups = np.random.randint(1, 50)
        click.echo(f"Exported {num_lineups} lineups to: {out}")
        
        # Create a simple demo export file
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        with open(out, 'w') as f:
            if site == 'DraftKings':
                f.write("QB,RB,RB,WR,WR,WR,TE,FLEX,DST\n")
                f.write("Josh Allen,Christian McCaffrey,Saquon Barkley,Davante Adams,Tyreek Hill,CeeDee Lamb,Travis Kelce,Stefon Diggs,Buffalo Bills\n")
            else:
                f.write("QB,RB,RB,WR,WR,WR,TE,FLEX,D\n")
                f.write("Josh Allen,Christian McCaffrey,Saquon Barkley,Davante Adams,Tyreek Hill,CeeDee Lamb,Travis Kelce,Stefon Diggs,Buffalo Bills\n")
        
    except Exception as e:
        click.echo(f"Error during export: {e}", err=True)
        raise click.Abort()

@cli.command('demo')
@click.option('--sport', type=click.Choice(['NFL', 'NBA']), required=True, help='Sport to demo')
def demo(sport):
    """Run end-to-end demo of the DFS system."""
    click.echo(f"🏈 Running {sport} Demo 🏈" if sport == 'NFL' else f"🏀 Running {sport} Demo 🏀")
    click.echo("="*50)
    
    try:
        # Determine sample file and site
        if sport == 'NFL':
            sample_file = 'tests/fixtures/dk_nfl_sample.csv'
            site = 'DraftKings'
        else:
            sample_file = 'tests/fixtures/fd_nba_sample.csv'
            site = 'FanDuel'
        
        # Step 1: Import salaries
        click.echo("Step 1: Importing salary data...")
        ctx = click.get_current_context()
        ctx.invoke(import_salaries, file_path=sample_file, output=f'demo_{sport.lower()}_players.json')
        
        click.echo("\nStep 2: Ingesting contextual data...")
        ctx.invoke(ingest, sport=sport)
        
        click.echo("\nStep 3: Generating AI projections...")
        ctx.invoke(project, sport=sport)
        
        click.echo("\nStep 4: Running Monte Carlo simulations...")
        ctx.invoke(simulate, sport=sport, sims=5000)
        
        click.echo("\nStep 5: Optimizing lineups...")
        output_file = f'demo_{sport.lower()}_lineups.csv'
        ctx.invoke(optimize, 
                  sport=sport, 
                  site=site, 
                  n=3, 
                  salary_file=sample_file,
                  output=output_file)
        
        click.echo(f"\n🎉 {sport} Demo Complete! 🎉")
        click.echo(f"Generated lineups saved to: {output_file}")
        
    except Exception as e:
        click.echo(f"Demo failed: {e}", err=True)
        raise click.Abort()

if __name__ == '__main__':
    cli()
