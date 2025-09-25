#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/healthcheck.sh "<name>" "<command>" [args...]
NAME="$1"; shift
CMD="$1"; shift || true

json() { jq -nc --arg name "$NAME" --arg cmd "$CMD" --arg status "$1" --arg reason "$2" \
  '{name:$name, command:$cmd, status:$status, reason:$reason}'; }

# --help (best-effort)
("$CMD" --help >/dev/null 2>&1) || true

# 3s liveness probe
( ( "$CMD" >/dev/null 2>&1 & echo $! > /tmp/mcp_pid.$$ ) ) || { json "fail" "spawn_error"; exit 0; }
PID=$(cat /tmp/mcp_pid.$$ || true)
sleep 1

if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
  sleep 2
  kill "$PID" >/dev/null 2>&1 || true
  json "ok" ""
else
  json "fail" "terminated"
fi
