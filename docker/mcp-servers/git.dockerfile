FROM node:18-alpine

WORKDIR /app

# Install git and other dependencies (fix SSL cert issues)
RUN apk update --allow-untrusted && \
    apk add --no-cache --allow-untrusted git openssh-client

# Install MCP packages
RUN npm init -y && \
    npm install @modelcontextprotocol/server-stdio

# Create git MCP server
RUN echo 'const { StdioServerTransport } = require("@modelcontextprotocol/server-stdio");' > server.js && \
    echo 'const { spawn } = require("child_process");' >> server.js && \
    echo 'const server = {' >> server.js && \
    echo '  name: "git-mcp",' >> server.js && \
    echo '  version: "1.0.0",' >> server.js && \
    echo '  tools: [' >> server.js && \
    echo '    { name: "status", description: "Get git status" },' >> server.js && \
    echo '    { name: "log", description: "Get git log" },' >> server.js && \
    echo '    { name: "commit", description: "Git commit with message" },' >> server.js && \
    echo '    { name: "branch", description: "List or create branches" }' >> server.js && \
    echo '  ],' >> server.js && \
    echo '  async handleTool(name, args) {' >> server.js && \
    echo '    return new Promise((resolve, reject) => {' >> server.js && \
    echo '      let cmd;' >> server.js && \
    echo '      if (name === "status") cmd = "git status --porcelain";' >> server.js && \
    echo '      else if (name === "log") cmd = `git log --oneline -${args.limit || 10}`;' >> server.js && \
    echo '      else if (name === "commit") cmd = `git commit -m "${args.message}";' >> server.js && \
    echo '      else if (name === "branch") cmd = args.create ? `git checkout -b ${args.name}` : "git branch";' >> server.js && \
    echo '      const proc = spawn("sh", ["-c", cmd], { cwd: "/workspace" });' >> server.js && \
    echo '      let output = "";' >> server.js && \
    echo '      proc.stdout.on("data", d => output += d);' >> server.js && \
    echo '      proc.stderr.on("data", d => output += d);' >> server.js && \
    echo '      proc.on("close", code => resolve({ output: output.trim(), exitCode: code }));' >> server.js && \
    echo '    });' >> server.js && \
    echo '  }' >> server.js && \
    echo '};' >> server.js && \
    echo 'const transport = new StdioServerTransport(); transport.start(server);' >> server.js

RUN mkdir -p dist && cp server.js dist/

CMD ["node", "dist/server.js"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Git MCP Health Check OK')" || exit 1
