#!/bin/bash
# Interface to Chroma MCP server container
# Container name: serene_hoover
# Provides vector database operations via docker exec

docker exec serene_hoover python3 main.py
