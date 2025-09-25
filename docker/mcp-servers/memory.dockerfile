FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache --allow-untrusted python3 py3-pip

# Set working directory
WORKDIR /app

# Copy server code
COPY mcp-servers/dfs-mcp/src/index.ts /app/index.ts
COPY mcp-servers/dfs-mcp/package*.json /app/

# Install dependencies
RUN npm install

# Expose port
EXPOSE 8080

# Run command
CMD ["node", "index.js"]
