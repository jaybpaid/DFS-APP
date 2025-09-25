import json
import os

# Path to Cline MCP settings
config_path = '../../../Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'

# New MCP servers to add
new_servers = {
  "gpt-researcher-mcp": {
    "autoApprove": ["gpt_researcher"],
    "disabled": False,
    "timeout": 60,
    "type": "stdio",
    "command": "node",
    "args": ["/Users/614759/Documents/MCP Workspace/DFS APP/docker/mcp-servers/advanced/gptr-mcp/index.js"]
  },
  "serena-code-analysis": {
    "autoApprove": ["serena_code_analysis"],
    "disabled": False,
    "timeout": 60,
    "type": "stdio",
    "command": "node",
    "args": ["/Users/614759/Documents/MCP Workspace/DFS APP/docker/mcp-servers/advanced/serena/src/server.js"]
  },
  "claude-flow": {
    "autoApprove": ["claude_flow"],
    "disabled": False,
    "timeout": 60,
    "type": "stdio",
    "command": "node",
    "args": ["/Users/614759/Documents/MCP Workspace/DFS APP/docker/mcp-servers/advanced/claude-flow-mcp/server.js"]
  },
  "google-genai-toolbox": {
    "autoApprove": ["google_genai_toolbox"],
    "disabled": False,
    "timeout": 60,
    "type": "stdio",
    "command": "node",
    "args": ["/Users/614759/Documents/MCP Workspace/DFS APP/docker/mcp-servers/advanced/genai-toolbox/server.js"],
    "env": {"GOOGLE_API_KEY": ""}
  },
  "pipedream-chat": {
    "autoApprove": ["pipedream_chat"],
    "disabled": False,
    "timeout": 60,
    "type": "stdio",
    "command": "node",
    "args": ["/Users/614759/Documents/MCP Workspace/DFS APP/docker/mcp-servers/advanced/pipedream-mcp/server.js"],
    "env": {"PIPEDREAM_API_KEY": ""}
  }
}

# Read current config
with open(config_path, 'r') as f:
    config = json.load(f)

# Add new servers
if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers'].update(new_servers)

# Write updated config
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("✅ Successfully added 5 enhanced MCP servers to Cline configuration!")
print("📋 New servers added:")
for server_name in new_servers:
    print(f"  • {server_name}")

print("\n🔄 Please restart Cline to load the new MCP servers.")
