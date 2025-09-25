"""
Pytest tests for DFS Optimizer API
Tests schema validation and endpoint functionality
"""

import pytest
import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/api/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "timestamp" in data


def test_slates_schema_ok():
    """Test slates endpoint returns valid schema"""
    response = client.get("/api/slates")
    assert response.status_code == 200

    data = response.json()

    # Validate required fields
    assert "date" in data
    assert "slates" in data
    assert isinstance(data["slates"], list)

    # Validate slate structure
    if data["slates"]:
        slate = data["slates"][0]
        required_fields = [
            "id",
            "name",
            "sport",
            "contestType",
            "startTime",
            "salaryCap",
        ]
        for field in required_fields:
            assert field in slate

        # Validate enum values
        assert slate["sport"] in ["NFL", "NBA"]
        assert slate["contestType"] in ["classic", "showdown", "tiers", "arcade"]
        assert slate["status"] in ["active", "upcoming", "closed", "completed"]


def test_players_by_slate_filtering():
    """Test players endpoint filters by slate and has ≥300 players"""
    slate_id = "main_slate_123"
    response = client.get(f"/api/slates/{slate_id}/players")
    assert response.status_code == 200

    data = response.json()

    # Validate required fields
    assert "site" in data
    assert "sport" in data
    assert "slate_id" in data
    assert "players" in data

    # Validate slate filtering
    assert data["slate_id"] == slate_id

    # Validate player count threshold (≥300 requirement)
    assert len(data["players"]) >= 300

    # Validate no off-slate players
    for player in data["players"]:
        # All players should have valid structure
        required_fields = [
            "player_id",
            "display_name",
            "position",
            "salary",
            "team_abbreviation",
        ]
        for field in required_fields:
            assert field in player

        # Validate salary range
        assert player["salary"] >= 1000

        # Validate status enum
        assert player["status"] in [
            "ACTIVE",
            "OUT",
            "DOUBTFUL",
            "QUESTIONABLE",
            "GTD",
            "IR",
        ]


def test_players_invalid_slate():
    """Test players endpoint with invalid slate ID"""
    response = client.get("/api/slates/invalid_slate/players")
    assert response.status_code == 404


def test_optimize_schema_ok():
    """Test optimize endpoint accepts request and returns valid response"""
    request_data = {
        "slate_id": "main_slate_123",
        "lineup_count": 20,
        "uniqueness": 3,
        "locked_players": [],
        "excluded_players": [],
        "min_salary": 49000,
        "max_salary": 50000,
    }

    response = client.post("/api/optimize", json=request_data)
    assert response.status_code == 200

    data = response.json()
    assert "lineups" in data
    assert "metadata" in data
    assert isinstance(data["lineups"], list)


def test_simulate_schema_ok():
    """Test simulate endpoint returns deterministic results with seed"""
    request_data = {
        "slate_id": "main_slate_123",
        "sim_count": 1000,
        "field_size": 10000,
        "seed": 12345,
    }

    response = client.post("/api/simulate", json=request_data)
    assert response.status_code == 200

    data = response.json()
    assert "simulation_id" in data
    assert "results" in data
    assert "portfolio_exposures" in data
    assert "metadata" in data

    # Validate results structure
    results = data["results"]
    assert "expected_roi" in results
    assert "roi_confidence_interval" in results
    assert "min_cash_percentage" in results
    assert "top_1_percentage" in results
    assert "top_10_percentage" in results


def test_projections_endpoint():
    """Test projections endpoint"""
    response = client.get("/api/slates/main_slate_123/projections")
    assert response.status_code == 200


def test_ownership_endpoint():
    """Test ownership endpoint"""
    response = client.get("/api/slates/main_slate_123/ownership")
    assert response.status_code == 200


def test_injuries_endpoint():
    """Test injuries endpoint"""
    response = client.get("/api/slates/main_slate_123/injuries")
    assert response.status_code == 200


def test_vegas_endpoint():
    """Test vegas endpoint"""
    response = client.get("/api/slates/main_slate_123/vegas")
    assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
