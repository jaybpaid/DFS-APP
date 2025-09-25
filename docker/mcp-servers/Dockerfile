# MCP Servers Container - Improved for security and reliability
FROM node:20-alpine

# Install basic dependencies required for MCP servers
RUN apk add --no-cache python3 py3-pip git curl

WORKDIR /mcp-servers

# Install standard MCP servers globally
RUN npm install -g \
    @modelcontextprotocol/server-sequential-thinking \
    @hisma/server-puppeteer \
    @modelcontextprotocol/server-filesystem \
    @modelcontextprotocol/server-memory \
    @modelcontextprotocol/server-everything \
    @modelcontextprotocol/server-brave-search \
    @modelcontextprotocol/server-github \
    @modelcontextprotocol/server-aws-kb-retrieval

# Install Python MCP servers
RUN pip3 install --break-system-packages mcp-server-git mcp-server-sqlite

# Create a dedicated, non-root user for security
RUN addgroup -S mcpuser && adduser -S mcpuser -G mcpuser

# Switch to the non-root user
USER mcpuser

# Copy startup script and set permissions
COPY simple-start.sh /mcp-servers/simple-start.sh
RUN chmod +x /mcp-servers/simple-start.sh

# Expose MCP server ports
EXPOSE 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010

# IMPROVED: Use a curl command to check a health endpoint from the gateway
# This is more reliable than checking for a process name.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3010/health || exit 1

# Start all MCP servers
CMD ["/mcp-servers/simple-start.sh"]
