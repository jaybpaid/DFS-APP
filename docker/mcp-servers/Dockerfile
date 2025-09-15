# MCP Servers Container - All MCP servers running in Docker
FROM node:20-alpine

# Install Python for Python-based MCP servers
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /mcp-servers

# Install all MCP servers globally
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
RUN pip3 install --break-system-packages \
    mcp-server-git \
    mcp-server-sqlite

# Create MCP server configuration
COPY mcp-config.json /mcp-servers/
COPY start-mcp-servers.sh /mcp-servers/
RUN chmod +x /mcp-servers/start-mcp-servers.sh

# Expose MCP server ports
EXPOSE 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start all MCP servers
CMD ["./start-mcp-servers.sh"]
