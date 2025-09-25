#!/usr/bin/env bash
set -euo pipefail
# STDIN/STDOUT bridge for puppeteer MCP
# Using working container with puppeteer capabilities
exec docker exec -i interesting_mccarthy npx @hisma/server-puppeteer "$@"
