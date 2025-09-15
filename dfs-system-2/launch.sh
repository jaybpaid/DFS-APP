#!/bin/bash
# Automated DFS Platform Launcher (Shell Script Version)

echo "🚀 Starting Automated DFS Platform..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start proxy server in background
echo "📡 Starting DraftKings API Proxy Server..."
python3 "$SCRIPT_DIR/draftkings_api_server.py" &
PROXY_PID=$!

echo "✅ Proxy server started (PID: $PROXY_PID)"

# Wait for server to start
sleep 3

# Open HTML file in browser
HTML_FILE="$SCRIPT_DIR/DFS_PROFESSIONAL_ENFORCEMENT.html"
echo "🌐 Opening DFS Platform: file://$HTML_FILE"

# Try different browser commands
if command -v open &> /dev/null; then
    open "$HTML_FILE"
elif command -v xdg-open &> /dev/null; then
    xdg-open "$HTML_FILE"
elif command -v start &> /dev/null; then
    start "$HTML_FILE"
else
    echo "⚠️  Could not automatically open browser. Please manually open:"
    echo "   file://$HTML_FILE"
fi

echo ""
echo "🎯 DFS Platform is now running!"
echo "📊 The app will automatically load player data on startup"
echo "🔄 Data refreshes every 5 minutes in ONLINE mode"
echo "⚡ Switch between NFL/NBA and ONLINE/OFFLINE modes as needed"
echo ""
echo "Press Ctrl+C to stop the proxy server..."

# Wait for proxy server
wait $PROXY_PID
