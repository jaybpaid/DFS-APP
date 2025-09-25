#!/bin/bash
# MCP Service Health Monitor
while true; do
    echo "$(date): Checking service health..."
    
    # Check API health
    if ! curl -s http://localhost:8000/health >/dev/null; then
        echo "$(date): API server down - attempting restart..."
        python3 "$(dirname "$0")/mcp-intelligent-restart.py" --service api
    fi
    
    # Check Frontend health
    if ! curl -s http://localhost:5173 >/dev/null; then
        echo "$(date): Frontend server down - attempting restart..."
        python3 "$(dirname "$0")/mcp-intelligent-restart.py" --service frontend
    fi
    
    sleep 30
done
