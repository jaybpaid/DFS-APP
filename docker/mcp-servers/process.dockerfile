FROM node:18-alpine

WORKDIR /app

# Install system dependencies for process execution
RUN apk add --no-cache bash curl python3 py3-pip git

# Install MCP server packages
RUN npm init -y && \
    npm install @modelcontextprotocol/server-stdio

# Create process MCP server
RUN echo 'const { StdioServerTransport } = require("@modelcontextprotocol/server-stdio");' > server.js && \
    echo 'const { spawn } = require("child_process");' >> server.js && \
    echo 'const server = {' >> server.js && \
    echo '  name: "process-mcp",' >> server.js && \
    echo '  version: "1.0.0",' >> server.js && \
    echo '  tools: [' >> server.js && \
    echo '    { name: "execute", description: "Execute shell command safely" }' >> server.js && \
    echo '  ],' >> server.js && \
    echo '  async handleTool(name, args) {' >> server.js && \
    echo '    if (name === "execute") {' >> server.js && \
    echo '      return new Promise((resolve, reject) => {' >> server.js && \
    echo '        const proc = spawn("sh", ["-c", args.command], { timeout: 30000 });' >> server.js && \
    echo '        let output = "";' >> server.js && \
    echo '        proc.stdout.on("data", d => output += d);' >> server.js && \
    echo '        proc.on("close", code => resolve({ output, exitCode: code }));' >> server.js && \
    echo '        proc.on("error", reject);' >> server.js && \
    echo '      });' >> server.js && \
    echo '    }' >> server.js && \
    echo '  }' >> server.js && \
    echo '};' >> server.js && \
    echo 'const transport = new StdioServerTransport(); transport.start(server);' >> server.js

RUN mkdir -p dist && cp server.js dist/

CMD ["node", "dist/server.js"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD echo "test" | node dist/server.js || exit 1
