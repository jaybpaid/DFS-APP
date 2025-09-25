#!/bin/bash

# Test POST /api/optimize endpoint with real NFL player data
curl -X POST http://localhost:8000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "slateId": "main_slate_123",
    "site": "DraftKings",
    "sport": "NFL",
    "nLineups": 10,
    "salaryCap": 50000,
    "rosterPositions": ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "DST"],
    "players": [
      {"id": "1", "name": "Josh Allen", "team": "BUF", "pos": "QB", "salary": 8800, "projPoints": 25.2},
      {"id": "2", "name": "Patrick Mahomes", "team": "KC", "pos": "QB", "salary": 8600, "projPoints": 24.4},
      {"id": "3", "name": "Stefon Diggs", "team": "BUF", "pos": "WR", "salary": 8200, "projPoints": 22.8},
      {"id": "4", "name": "Travis Kelce", "team": "KC", "pos": "TE", "salary": 7800, "projPoints": 19.6},
      {"id": "5", "name": "Tyreek Hill", "team": "KC", "pos": "WR", "salary": 7600, "projPoints": 21.1},
      {"id": "6", "name": "James Cook", "team": "BUF", "pos": "RB", "salary": 7400, "projPoints": 18.3},
      {"id": "7", "name": "Isiah Pacheco", "team": "KC", "pos": "RB", "salary": 7200, "projPoints": 16.7},
      {"id": "8", "name": "Gabe Davis", "team": "BUF", "pos": "WR", "salary": 6800, "projPoints": 15.9},
      {"id": "9", "name": "CeeDee Lamb", "team": "DAL", "pos": "WR", "salary": 8600, "projPoints": 23.5},
      {"id": "10", "name": "Christian McCaffrey", "team": "SF", "pos": "RB", "salary": 9200, "projPoints": 26.8},
      {"id": "11", "name": "Dak Prescott", "team": "DAL", "pos": "QB", "salary": 8400, "projPoints": 22.7},
      {"id": "12", "name": "Brock Purdy", "team": "SF", "pos": "QB", "salary": 8000, "projPoints": 21.9},
      {"id": "13", "name": "Deebo Samuel", "team": "SF", "pos": "WR", "salary": 8000, "projPoints": 20.2},
      {"id": "14", "name": "George Kittle", "team": "SF", "pos": "TE", "salary": 7600, "projPoints": 18.8},
      {"id": "15", "name": "Brandon Aiyuk", "team": "SF", "pos": "WR", "salary": 7400, "projPoints": 18.1},
      {"id": "16", "name": "Ezekiel Elliott", "team": "DAL", "pos": "RB", "salary": 6800, "projPoints": 15.4},
      {"id": "17", "name": "Dawson Knox", "team": "BUF", "pos": "TE", "salary": 6400, "projPoints": 12.3},
      {"id": "18", "name": "JuJu Smith-Schuster", "team": "KC", "pos": "WR", "salary": 6200, "projPoints": 11.8},
      {"id": "19", "name": "Amari Cooper", "team": "DAL", "pos": "WR", "salary": 6800, "projPoints": 14.9},
      {"id": "20", "name": "Jake Ferguson", "team": "DAL", "pos": "TE", "salary": 5800, "projPoints": 10.6},
      {"id": "21", "name": "Buffalo Bills DST", "team": "BUF", "pos": "DST", "salary": 4800, "projPoints": 9.2},
      {"id": "22", "name": "Kansas City Chiefs DST", "team": "KC", "pos": "DST", "salary": 4600, "projPoints": 8.8},
      {"id": "23", "name": "Dallas Cowboys DST", "team": "DAL", "pos": "DST", "salary": 4400, "projPoints": 8.5},
      {"id": "24", "name": "San Francisco 49ers DST", "team": "SF", "pos": "DST", "salary": 4200, "projPoints": 8.1}
    ],
    "constraints": {
      "minSalary": 3000,
      "maxSalary": 45000,
      "salaryCapBuffer": 0,
      "maxPlayersFromTeam": 6,
      "maxByPosition": {"QB": 1, "RB": 2, "WR": 3, "TE": 1, "FLEX": 1, "DST": 1}
    },
    "useILPSolver": true
  }'
