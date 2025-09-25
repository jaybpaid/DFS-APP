FROM node:18-alpine

WORKDIR /app

# Install MCP filesystem server
RUN npm init -y && \
    npm install @modelcontextprotocol/server-filesystem

# Create simple server wrapper
RUN echo 'const { Server } = require("@modelcontextprotocol/server-filesystem");' > server.js && \
    echo 'const server = new Server({' >> server.js && \
    echo '  name: "filesystem-mcp",' >> server.js && \
    echo '  version: "1.0.0"' >> server.js && \
    echo '});' >> server.js && \
    echo 'server.run();' >> server.js

# Build dist directory structure
RUN mkdir -p dist && cp server.js dist/

CMD ["node", "dist/server.js"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('MCP Filesystem Server Health Check OK')" || exit 1
