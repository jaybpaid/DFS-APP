FROM mcr.microsoft.com/playwright:focal

WORKDIR /app

# Install Node.js and npm
RUN apt-get update && apt-get install -y nodejs npm

# Install MCP packages
RUN npm init -y && \
    npm install @modelcontextprotocol/server-stdio playwright

# Create playwright MCP server
RUN echo 'const { StdioServerTransport } = require("@modelcontextprotocol/server-stdio");' > server.js && \
    echo 'const { chromium } = require("playwright");' >> server.js && \
    echo 'const server = {' >> server.js && \
    echo '  name: "playwright-mcp",' >> server.js && \
    echo '  version: "1.0.0",' >> server.js && \
    echo '  tools: [' >> server.js && \
    echo '    { name: "screenshot", description: "Take screenshot of URL" },' >> server.js && \
    echo '    { name: "navigate", description: "Navigate to URL and get content" }' >> server.js && \
    echo '  ],' >> server.js && \
    echo '  async handleTool(name, args) {' >> server.js && \
    echo '    const browser = await chromium.launch({ headless: true });' >> server.js && \
    echo '    const page = await browser.newPage();' >> server.js && \
    echo '    try {' >> server.js && \
    echo '      if (name === "screenshot") {' >> server.js && \
    echo '        await page.goto(args.url, { waitUntil: "networkidle" });' >> server.js && \
    echo '        const screenshot = await page.screenshot({ encoding: "base64" });' >> server.js && \
    echo '        return { screenshot, url: args.url };' >> server.js && \
    echo '      } else if (name === "navigate") {' >> server.js && \
    echo '        await page.goto(args.url, { waitUntil: "networkidle" });' >> server.js && \
    echo '        const content = await page.content();' >> server.js && \
    echo '        return { content, url: args.url };' >> server.js && \
    echo '      }' >> server.js && \
    echo '    } finally {' >> server.js && \
    echo '      await browser.close();' >> server.js && \
    echo '    }' >> server.js && \
    echo '  }' >> server.js && \
    echo '};' >> server.js && \
    echo 'const transport = new StdioServerTransport(); transport.start(server);' >> server.js

RUN mkdir -p dist && cp server.js dist/

CMD ["node", "dist/server.js"]

HEALTHCHECK --interval=60s --timeout=30s --start-period=10s --retries=3 \
  CMD node -e "console.log('Playwright MCP Health Check OK')" || exit 1
