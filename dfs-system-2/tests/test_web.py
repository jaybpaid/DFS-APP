import pytest
from fastapi.testclient import TestClient
from src.web.app import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome to the DFS System" in response.text

def test_upload_csv_endpoint():
    response = client.post("/upload-csv", files={"file": ("test.csv", "dummy data")})
    assert response.status_code == 200
    assert "CSV uploaded successfully" in response.text

def test_get_lineups_endpoint():
    response = client.get("/lineups")
    assert response.status_code == 200
    assert isinstance(response.json(), list)  # Expecting a list of lineups

def test_select_slate_endpoint():
    response = client.post("/select-slate", json={"slate_id": 1})
    assert response.status_code == 200
    assert "Slate selected successfully" in response.text

def test_invalid_csv_upload():
    response = client.post("/upload-csv", files={"file": ("invalid.csv", "invalid data")})
    assert response.status_code == 400
    assert "Invalid CSV format" in response.text

def test_get_metrics_endpoint():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "Metrics data" in response.text  # Adjust based on actual metrics response structure