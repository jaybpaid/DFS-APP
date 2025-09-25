# DFS App Architecture & Dataflow Diagram

## **🏗️ SYSTEM ARCHITECTURE OVERVIEW**

```mermaid
graph TB
    subgraph "Frontend Layer (React/TypeScript)"
        A[App.tsx - Router] --> B[Sidebar Navigation]
        A --> C[Header Component]
        A --> D[Main Content Area]

        D --> E[Dashboard /]
        D --> F[Live Dashboard /dashboard/live]
        D --> G[Superior Dashboard /superior]
        D --> H[AI Dashboard /ai-dashboard]
        D --> I[Optimizer /optimizer]
        D --> J[Simulations /sims]
        D --> K[Content Hub /content]
        D --> L[Uploads /uploads]
        D --> M[Settings /settings]
    end

    subgraph "State Management"
        N[DFS Store - Zustand]
        O[React Query Cache]
        P[Local State Hooks]
    end

    subgraph "API Layer"
        Q[Node.js API /api]
        R[Python API /api-python]
        S[MCP Gateway]
    end

    subgraph "MCP Servers Layer"
        T[Docker Gateway MCP]
        U[Memory MCP]
        V[GitHub MCP]
        W[Brave Search MCP]
        X[Puppeteer MCP]
        Y[Context7 MCP]
        Z[Filesystem MCP]
        AA[Sequential Thinking MCP]
        BB[AWS KB Retrieval MCP]
    end

    subgraph "Data Processing"
        CC[Optimization Engine - OR-Tools]
        DD[Simulation Engine - Monte Carlo]
        EE[Analytics Engine]
        FF[Data Pipeline]
        GG[Cache Layer - Redis]
    end

    subgraph "External APIs"
        HH[DraftKings API]
        II[Weather API]
        JJ[RSS Feeds]
        KK[OpenRouter AI]
        LL[Injury Data]
        MM[Vegas Lines]
    end

    subgraph "Database Layer"
        NN[PostgreSQL]
        OO[File Storage]
        PP[JSON Contracts]
    end

    %% Data Flow Connections
    E --> N
    F --> N
    G --> N
    H --> N
    I --> N

    N --> Q
    N --> R

    Q --> S
    R --> S

    S --> T
    S --> U
    S --> V
    S --> W
    S --> X
    S --> Y
    S --> Z
    S --> AA
    S --> BB

    R --> CC
    R --> DD
    R --> EE
    R --> FF

    FF --> HH
    FF --> II
    FF --> JJ
    FF --> KK
    FF --> LL
    FF --> MM

    CC --> GG
    DD --> GG
    EE --> GG

    GG --> NN
    FF --> OO
    Q --> PP
    R --> PP
```

## **📊 COMPONENT HIERARCHY DIAGRAM**

```mermaid
graph TD
    subgraph "Dashboard Components"
        A[App.tsx] --> B[Layout Components]
        B --> C[Sidebar.tsx]
        B --> D[Header.tsx]

        A --> E[Page Components]
        E --> F[HomePage - page.tsx]
        E --> G[LiveDashboard - live/page.tsx]
        E --> H[SuperiorDashboard - superior/page.tsx]
        E --> I[AIEnhancedDashboard]
        E --> J[MCPEnhancedDashboard]
        E --> K[OptimizerPage - optimizer/page.tsx]

        F --> L[Quick Actions Grid]
        F --> M[System Stats Cards]
        F --> N[Current Slate Display]
        F --> O[Activity Feed]

        G --> P[Live Slate Selector]
        G --> Q[ROI Analytics Charts]
        G --> R[Monte Carlo Results]
        G --> S[Live Player Rankings]
        G --> T[Auto-Refresh Controls]

        H --> U[AI Insights Feed]
        H --> V[Market Overview Tiles]
        H --> W[Elite Player Analysis]
        H --> X[AI Optimizer Controls]
        H --> Y[Market Trends Sidebar]

        K --> Z[Professional Slate Selector]
        K --> AA[Game Strip Filter]
        K --> BB[Player Pool Table]
        K --> CC[Optimization Settings]
        K --> DD[Results Display]
    end

    subgraph "Shared Components"
        EE[UI Components]
        EE --> FF[Card.tsx]
        EE --> GG[Button.tsx]
        EE --> HH[Badge.tsx]
        EE --> II[Input.tsx]
        EE --> JJ[Tabs.tsx]
        EE --> KK[Select.tsx]
        EE --> LL[Alert.tsx]

        MM[Business Components]
        MM --> NN[PlayerPoolTable.tsx]
        MM --> OO[EnhancedPlayerPoolTable.tsx]
        MM --> PP[GameStrip.tsx]
        MM --> QQ[DateSlateSelector.tsx]
        MM --> RR[LineupCardPro.tsx]
        MM --> SS[RunSummary.tsx]
        MM --> TT[LineupGrid.tsx]
    end

    subgraph "Data Hooks & Services"
        UU[Custom Hooks]
        UU --> VV[usePlayerPool.ts]
        UU --> WW[useDfsStore.ts]

        XX[Services]
        XX --> YY[mcp-integration.ts]
        XX --> ZZ[draftkings-proxy.ts]
    end
```

## **🔄 DATA FLOW ARCHITECTURE**

```mermaid
sequenceDiagram
    participant U as User
    participant D as Dashboard
    participant S as State Store
    participant A as API Layer
    participant M as MCP Gateway
    participant E as External APIs
    participant DB as Database

    U->>D: Navigate to Dashboard
    D->>S: Request Current State
    S->>A: Fetch Dashboard Data
    A->>M: Request MCP Services
    M->>E: Fetch External Data
    E-->>M: Return Data
    M-->>A: Processed Data
    A->>DB: Store/Cache Data
    A-->>S: Update State
    S-->>D: Render Updated UI
    D-->>U: Display Dashboard

    Note over D,S: Real-time Updates (30-60s)
    D->>S: Auto-refresh Trigger
    S->>A: Background Data Fetch
    A->>M: MCP Update Request
    M-->>A: Fresh Data
    A-->>S: State Update
    S-->>D: UI Update
```

## **🎯 DASHBOARD ENHANCEMENT PLAN USING MCP TOOLS**

Now I'll use the available MCP servers to enhance your dashboard functionality:

### **1. Memory MCP Integration**

- **Knowledge Graph**: Store player relationships, team correlations
- **Entity Tracking**: Player performance history, injury patterns
- **Observation Management**: Market trends, ownership changes

### **2. Sequential Thinking MCP**

- **Complex Analysis**: Multi-step optimization decisions
- **Problem Solving**: Advanced portfolio management
- **Dynamic Reasoning**: Real-time strategy adjustments

### **3. Brave Search MCP**

- **News Integration**: Real-time DFS news and updates
- **Market Research**: Competitor analysis and trends
- **Content Discovery**: Expert insights and analysis

### **4. GitHub MCP**

- **Version Control**: Dashboard component updates
- **Issue Tracking**: Feature requests and bug reports
- **Deployment**: Automated dashboard releases

### **5. Context7 MCP**

- **Documentation**: Enhanced help and tutorials
- **API References**: Real-time documentation updates
- **Feature Guides**: Interactive dashboard walkthroughs

### **6. Docker Gateway MCP**

- **Container Management**: MCP server orchestration
- **Service Health**: Real-time system monitoring
- **Resource Optimization**: Performance enhancement

### **7. Puppeteer MCP**

- **Web Scraping**: Live data from competitor sites
- **Screenshot Testing**: Dashboard UI validation
- **Automated Testing**: End-to-end dashboard tests

### **8. Filesystem MCP**

- **Configuration Management**: Dynamic dashboard settings
- **Log Analysis**: System performance monitoring
- **Asset Management**: Dashboard resource optimization
