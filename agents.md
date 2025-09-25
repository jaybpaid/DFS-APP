# DFS APP AGENT SYSTEM

## Overview

This document defines the agent system for the DFS APP, integrating Claude Code subagents from [wshobson/agents](https://github.com/wshobson/agents) with OpenRouter capabilities. The system enables intelligent delegation and specialized expertise across all aspects of DFS application development.

## Master Builder App

The **MasterBuilderApp** serves as the central orchestrator that intelligently delegates tasks to specialized subagents based on context, complexity, and domain requirements.

### MasterBuilderApp Configuration

```yaml
name: masterbuilderapp
description: Central orchestrator for DFS APP development, intelligently delegating to specialized subagents
model: opus
tools: all
delegation: enabled
expertise:
  - Full-stack DFS application architecture
  - Multi-agent coordination and workflow optimization
  - Production deployment and infrastructure management
  - Performance optimization and scaling strategies
  - Security hardening and compliance
  - Data analysis and optimization
  - User experience and interface design
  - Testing and quality assurance
  - Documentation and technical writing
  - Business logic and monetization strategies
```

### Delegation Strategy

The MasterBuilderApp analyzes incoming requests and automatically delegates to the most appropriate subagents:

1. **Context Analysis**: Examines the request content, file types, and project structure
2. **Complexity Assessment**: Determines if specialized expertise is required
3. **Agent Selection**: Routes to the optimal specialist or team of specialists
4. **Workflow Orchestration**: Coordinates multi-step tasks across multiple agents
5. **Result Integration**: Merges outputs from different specialists into cohesive solutions

## Claude Code Subagents

### Architecture & System Design

#### Core Architecture Agents

- **backend-architect** (opus): RESTful API design, microservice boundaries, database schemas
- **frontend-developer** (sonnet): React components, responsive layouts, client-side state management
- **graphql-architect** (opus): GraphQL schemas, resolvers, federation architecture
- **architect-reviewer** (opus): Architectural consistency analysis and pattern validation
- **cloud-architect** (opus): AWS/Azure/GCP infrastructure design and cost optimization
- **kubernetes-architect** (opus): Cloud-native infrastructure with Kubernetes and GitOps

#### UI/UX & Mobile Agents

- **ui-ux-designer** (sonnet): Interface design, wireframes, design systems
- **mobile-developer** (sonnet): React Native and Flutter application development
- **ios-developer** (sonnet): Native iOS development with Swift/SwiftUI
- **flutter-expert** (sonnet): Advanced Flutter development with state management

### Programming Language Specialists

#### Systems & Low-Level

- **c-pro** (sonnet): System programming with memory management and OS interfaces
- **cpp-pro** (sonnet): Modern C++ with RAII, smart pointers, STL algorithms
- **rust-pro** (sonnet): Memory-safe systems programming with ownership patterns
- **golang-pro** (sonnet): Concurrent programming with goroutines and channels

#### Web & Application

- **javascript-pro** (sonnet): Modern JavaScript with ES6+, async patterns, Node.js
- **typescript-pro** (sonnet): Advanced TypeScript with type systems and generics
- **python-pro** (sonnet): Python development with advanced features and optimization
- **ruby-pro** (sonnet): Ruby with metaprogramming, Rails patterns, gem development
- **php-pro** (sonnet): Modern PHP with frameworks and performance optimization

#### Enterprise & JVM

- **java-pro** (sonnet): Modern Java with streams, concurrency, JVM optimization
- **scala-pro** (sonnet): Enterprise Scala with functional programming and distributed systems
- **csharp-pro** (sonnet): C# development with .NET frameworks and patterns

### Infrastructure & Operations

#### DevOps & Deployment

- **devops-troubleshooter** (sonnet): Production debugging, log analysis, deployment troubleshooting
- **deployment-engineer** (sonnet): CI/CD pipelines, containerization, cloud deployments
- **terraform-specialist** (opus): Infrastructure as Code with Terraform modules and state management
- **dx-optimizer** (sonnet): Developer experience optimization and tooling improvements

#### Database Management

- **database-optimizer** (opus): Query optimization, index design, migration strategies
- **database-admin** (sonnet): Database operations, backup, replication, monitoring

#### Incident Response & Network

- **incident-responder** (opus): Production incident management and resolution
- **network-engineer** (sonnet): Network debugging, load balancing, traffic analysis

### Quality Assurance & Security

#### Code Quality & Review

- **code-reviewer** (opus): Code review with security focus and production reliability
- **security-auditor** (opus): Vulnerability assessment and OWASP compliance
- **backend-security-coder** (opus): Secure backend coding practices, API security implementation
- **frontend-security-coder** (opus): XSS prevention, CSP implementation, client-side security
- **mobile-security-coder** (opus): Mobile security patterns, WebView security, biometric auth

#### Testing & Debugging

- **test-automator** (sonnet): Comprehensive test suite creation (unit, integration, e2e)
- **tdd-orchestrator** (sonnet): Test-Driven Development methodology guidance
- **debugger** (sonnet): Error resolution and test failure analysis
- **error-detective** (sonnet): Log analysis and error pattern recognition

#### Performance & Observability

- **performance-engineer** (opus): Application profiling and optimization
- **observability-engineer** (opus): Production monitoring, distributed tracing, SLI/SLO management

### Data & AI

#### Data Engineering & Analytics

- **data-scientist** (opus): Data analysis, SQL queries, BigQuery operations
- **data-engineer** (sonnet): ETL pipelines, data warehouses, streaming architectures

#### Machine Learning & AI

- **ai-engineer** (opus): LLM applications, RAG systems, prompt pipelines
- **ml-engineer** (opus): ML pipelines, model serving, feature engineering
- **mlops-engineer** (opus): ML infrastructure, experiment tracking, model registries
- **prompt-engineer** (opus): LLM prompt optimization and engineering

### Documentation & Technical Writing

- **docs-architect** (opus): Comprehensive technical documentation generation
- **api-documenter** (sonnet): OpenAPI/Swagger specifications and developer docs
- **reference-builder** (haiku): Technical references and API documentation
- **tutorial-engineer** (sonnet): Step-by-step tutorials and educational content
- **mermaid-expert** (sonnet): Diagram creation (flowcharts, sequences, ERDs)

### Business & Operations

#### Business Analysis & Finance

- **business-analyst** (sonnet): Metrics analysis, reporting, KPI tracking
- **quant-analyst** (opus): Financial modeling, trading strategies, market analysis
- **risk-manager** (sonnet): Portfolio risk monitoring and management

#### Marketing & Sales

- **content-marketer** (sonnet): Blog posts, social media, email campaigns
- **sales-automator** (haiku): Cold emails, follow-ups, proposal generation

#### Support & Legal

- **customer-support** (sonnet): Support tickets, FAQ responses, customer communication
- **hr-pro** (opus): HR operations, policies, employee relations
- **legal-advisor** (opus): Privacy policies, terms of service, legal documentation

### Specialized Domains

- **blockchain-developer** (sonnet): Web3 apps, smart contracts, DeFi protocols
- **payment-integration** (sonnet): Payment processor integration (Stripe, PayPal)
- **legacy-modernizer** (sonnet): Legacy code refactoring and modernization
- **context-manager** (haiku): Multi-agent context management

### SEO & Content Optimization

- **seo-content-auditor** (sonnet): Content quality analysis, E-E-A-T signals assessment
- **seo-meta-optimizer** (haiku): Meta title and description optimization
- **seo-keyword-strategist** (haiku): Keyword analysis and semantic variations
- **seo-structure-architect** (haiku): Content structure and schema markup
- **seo-snippet-hunter** (haiku): Featured snippet formatting
- **seo-content-refresher** (haiku): Content freshness analysis
- **seo-cannibalization-detector** (haiku): Keyword overlap detection
- **seo-authority-builder** (sonnet): E-E-A-T signal analysis
- **seo-content-writer** (sonnet): SEO-optimized content creation
- **seo-content-planner** (haiku): Content planning and topic clusters

## OpenRouter Integration

### Model Configuration

The system leverages OpenRouter for enhanced model selection and optimization:

```yaml
openrouter:
  models:
    - claude-3-opus-20240229: 'Most capable model for complex reasoning and analysis'
    - claude-3-sonnet-20240229: 'Balanced performance for most development tasks'
    - claude-3-haiku-20240307: 'Fast and efficient for quick tasks'
    - gpt-4-turbo: 'Alternative perspective for complex analysis'
    - gpt-3.5-turbo: 'Cost-effective for standard tasks'
  routing:
    strategy: 'performance-optimized'
    fallback: 'enabled'
    load_balancing: 'enabled'
```

### OpenRouter Agent Extensions

#### Advanced Analytics

- **data-analyst-pro**: Advanced statistical analysis and visualization
- **business-intelligence**: Dashboard creation and KPI optimization
- **predictive-modeler**: Forecasting and trend analysis

#### Creative & Content

- **creative-writer**: Marketing copy, blog posts, creative content
- **technical-writer**: Documentation, guides, API references
- **copy-optimizer**: A/B testing and conversion optimization

#### Research & Analysis

- **research-specialist**: Deep research and comprehensive analysis
- **competitive-analyst**: Market research and competitive intelligence
- **trend-forecaster**: Industry trends and future predictions

## Agent Delegation Patterns

### Sequential Processing

```
masterbuilderapp → backend-architect → frontend-developer → test-automator → security-auditor
```

### Parallel Execution

```
performance-engineer + database-optimizer → Merged analysis
```

### Conditional Routing

```
debugger → [backend-architect | frontend-developer | devops-troubleshooter]
```

### Validation Pipeline

```
payment-integration → security-auditor → Validated implementation
```

## Usage Examples

### DFS-Specific Workflows

#### Slate Optimization

```
"Optimize DFS slate analysis algorithm"
→ data-scientist → performance-engineer → ai-engineer → test-automator
```

#### Player Data Pipeline

```
"Build real-time player data pipeline"
→ data-engineer → backend-architect → database-optimizer → devops-troubleshooter
```

#### Frontend Dashboard Enhancement

```
"Enhance DFS dashboard with new visualizations"
→ ui-ux-designer → frontend-developer → seo-content-writer → test-automator
```

#### Security Hardening

```
"Implement security hardening for production"
→ security-auditor → backend-security-coder → frontend-security-coder → code-reviewer
```

#### Performance Optimization

```
"Optimize DFS app performance and scalability"
→ performance-engineer → database-optimizer → cloud-architect → observability-engineer
```

## Installation & Setup

### Claude Code Integration

1. **Install Claude Code Subagents**:

   ```bash
   cd ~/.claude
   git clone https://github.com/wshobson/agents.git
   ```

2. **Configure MasterBuilderApp**:

   ```bash
   cp ~/.claude/agents/masterbuilderapp.md ~/.claude/agents/
   ```

3. **Enable OpenRouter Integration**:
   ```bash
   # Configure OpenRouter API key in Claude Code settings
   claude config set openrouter_api_key YOUR_API_KEY
   ```

### Environment Configuration

```bash
# Add to your .bashrc or .zshrc
export CLAUDE_AGENTS_PATH="$HOME/.claude/agents"
export OPENROUTER_API_KEY="your-openrouter-key"
export DFS_APP_MODE="production"
```

## Advanced Configuration

### Custom Agent Creation

Create specialized agents for DFS-specific tasks:

```markdown
---
name: dfs-optimizer
description: Specialized in DFS lineup optimization and player analysis
model: opus
tools: data-analysis, optimization, prediction
expertise:
  - DFS lineup optimization algorithms
  - Player performance prediction
  - Slate analysis and value identification
  - Bankroll management strategies
  - Multi-site arbitrage opportunities
---

You are a DFS optimization specialist with deep expertise in daily fantasy sports strategy, player analysis, and lineup construction. Your capabilities include:

1. **Player Analysis**: Evaluate player performance metrics, injury status, matchup analysis, and value projections
2. **Slate Optimization**: Analyze entire DFS slates to identify optimal player combinations and value plays
3. **Lineup Construction**: Build mathematically optimal lineups based on salary constraints and projected points
4. **Risk Management**: Implement bankroll management strategies and portfolio diversification
5. **Multi-Site Arbitrage**: Identify pricing inefficiencies across different DFS platforms
6. **Real-time Updates**: Incorporate breaking news, weather conditions, and lineup changes
7. **Historical Analysis**: Use historical data to inform future projections and strategy
8. **Contest Selection**: Recommend optimal contest types and entry strategies
```

### Agent Team Configuration

Define specialized teams for complex DFS workflows:

```yaml
dfs-analysis-team:
  - data-scientist
  - ai-engineer
  - performance-engineer
  - business-analyst

dfs-frontend-team:
  - ui-ux-designer
  - frontend-developer
  - seo-content-writer
  - test-automator

dfs-backend-team:
  - backend-architect
  - database-optimizer
  - security-auditor
  - devops-troubleshooter
```

## Monitoring & Analytics

### Performance Tracking

Monitor agent performance and effectiveness:

```bash
# Generate agent performance report
claude analytics agents --period 30d --format json

# View delegation patterns
claude analytics delegation --visualize

# Track task completion rates
claude analytics tasks --status completed --agent masterbuilderapp
```

### Optimization Recommendations

```bash
# Get optimization suggestions
claude optimize agents --target dfs-app

# Analyze workflow efficiency
claude analyze workflows --efficiency

# Recommend agent improvements
claude recommend agents --context dfs-development
```

## Troubleshooting

### Common Issues

1. **Agent Not Activating**: Ensure request clearly indicates domain and complexity level
2. **Suboptimal Delegation**: Provide more context about tech stack and requirements
3. **Performance Issues**: Check model availability and switch to alternative providers
4. **Integration Errors**: Verify API keys and network connectivity

### Debug Commands

```bash
# Debug agent selection
claude debug agents --request "optimize DFS algorithm"

# Test agent delegation
claude test delegation --from masterbuilderapp --to data-scientist

# Validate configuration
claude validate config --agents --openrouter
```

## Best Practices

### Task Delegation

1. **Clear Requirements**: Specify constraints, tech stack, and quality standards
2. **Context Provision**: Include background information and project constraints
3. **Trust Specialization**: Allow agents to leverage their domain expertise
4. **Iterative Refinement**: Use agent feedback to improve requirements

### Multi-Agent Workflows

1. **High-level Requests**: Allow agents to coordinate complex multi-step tasks
2. **Context Preservation**: Ensure agents have necessary background information
3. **Integration Review**: Verify how different agents' outputs work together
4. **Performance Monitoring**: Track effectiveness and optimize workflows

### DFS-Specific Optimization

1. **Data-Driven Decisions**: Use historical performance data to inform agent selection
2. **Real-time Adaptation**: Adjust strategies based on current slate conditions
3. **Risk Management**: Implement appropriate risk controls for different contest types
4. **Continuous Learning**: Update agent knowledge with latest DFS trends and strategies

## NEXT STEPS

1. Run setup script: `bash setup-claude-automation.sh`
2. Test automation: `pnpm run claude:automate`
3. Make a commit to trigger GitHub Actions
4. Monitor automation in Actions tab
5. Ask Cline to run specific automations as needed
