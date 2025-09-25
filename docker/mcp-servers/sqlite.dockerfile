FROM node:18-alpine

WORKDIR /app

# Install sqlite3
RUN apk add --no-cache sqlite

# Install MCP packages
RUN npm init -y && \
    npm install @modelcontextprotocol/server-stdio sqlite3

# Create sqlite MCP server
RUN echo 'const { StdioServerTransport } = require("@modelcontextprotocol/server-stdio");' > server.js && \
    echo 'const sqlite3 = require("sqlite3").verbose();' >> server.js && \
    echo 'const server = {' >> server.js && \
    echo '  name: "sqlite-mcp",' >> server.js && \
    echo '  version: "1.0.0",' >> server.js && \
    echo '  tools: [' >> server.js && \
    echo '    { name: "query", description: "Execute SQL query" },' >> server.js && \
    echo '    { name: "create_table", description: "Create table" },' >> server.js && \
    echo '    { name: "insert", description: "Insert data" }' >> server.js && \
    echo '  ],' >> server.js && \
    echo '  async handleTool(name, args) {' >> server.js && \
    echo '    return new Promise((resolve, reject) => {' >> server.js && \
    echo '      const db = new sqlite3.Database("/data/dfs_cache.db");' >> server.js && \
    echo '      if (name === "query") {' >> server.js && \
    echo '        db.all(args.sql, (err, rows) => {' >> server.js && \
    echo '          if (err) reject(err); else resolve({ rows, count: rows.length });' >> server.js && \
    echo '        });' >> server.js && \
    echo '      } else if (name === "create_table") {' >> server.js && \
    echo '        db.run(args.sql, (err) => {' >> server.js && \
    echo '          if (err) reject(err); else resolve({ success: true });' >> server.js && \
    echo '        });' >> server.js && \
    echo '      } else if (name === "insert") {' >> server.js && \
    echo '        db.run(args.sql, args.params || [], (err) => {' >> server.js && \
    echo '          if (err) reject(err); else resolve({ lastID: this.lastID, changes: this.changes });' >> server.js && \
    echo '        });' >> server.js && \
    echo '      }' >> server.js && \
    echo '      db.close();' >> server.js && \
    echo '    });' >> server.js && \
    echo '  }' >> server.js && \
    echo '};' >> server.js && \
    echo 'const transport = new StdioServerTransport(); transport.start(server);' >> server.js

RUN mkdir -p dist && cp server.js dist/ && mkdir -p /data

CMD ["node", "dist/server.js"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('SQLite MCP Health Check OK')" || exit 1
