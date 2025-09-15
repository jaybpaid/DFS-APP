#!/usr/bin/env python3
"""
Test optimization with real DraftKings data
"""

import asyncio
from src.optimize.live_data_optimizer import live_optimizer

async def test_optimization():
    # Load data first
    print('Loading live data...')
    success = await live_optimizer.load_live_data()
    print(f'Data loaded: {success}')
    print(f'Players available: {len(live_optimizer.players)}')

    if live_optimizer.players:
        # Check position distribution
        positions = {}
        salaries = []
        projections = []
        for p in live_optimizer.players:
            pos = p.position
            if pos not in positions:
                positions[pos] = 0
            positions[pos] += 1
            salaries.append(p.salary)
            projections.append(p.projection)
        print(f'Position distribution: {positions}')
        print(f'Salary range: ${min(salaries)} - ${max(salaries)}')
        print(f'Projection range: {min(projections):.1f} - {max(projections):.1f}')

        # Check for invalid data
        invalid_count = 0
        for p in live_optimizer.players:
            if p.salary <= 0 or p.projection < 0:
                invalid_count += 1
        print(f'Invalid players (bad salary/projection): {invalid_count}')

        # Try to generate one lineup
        print('Generating lineup...')
        lineups = live_optimizer.generate_lineups(num_lineups=1)
        print(f'Lineups generated: {len(lineups)}')

        if lineups:
            lineup = lineups[0]
            print(f'Lineup salary: ${lineup.total_salary}')
            print(f'Lineup projection: {lineup.total_projection} pts')
            print('Players:')
            for p in lineup.players:
                print(f'  {p.position}: {p.name} (${p.salary}) - {p.projection} pts')
        else:
            print('No lineups generated - checking constraints...')
            # Check if we have minimum required players
            min_required = live_optimizer._get_min_players_required()
            print(f'Minimum players required: {min_required}')
            print(f'Available players: {len(live_optimizer.players)}')

if __name__ == "__main__":
    asyncio.run(test_optimization())
