# QA Platform Architecture

## System Overview

The QA Platform is a multi-tenant SaaS application for automated test management with AI-powered test generation.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        GHPages[GitHub Pages<br/>Static Export]
    end

    subgraph "Frontend - Next.js 14"
        AppRouter[App Router]
        Components[React Components]
        ZustandStore[Zustand Store]
        APIClient[API Client<br/>axios + mock fallback]
    end

    subgraph "Backend - NestJS"
        API[REST API<br/>:3001]
        WSGateway[WebSocket Gateway<br/>Socket.IO]
        AuthModule[Auth Module<br/>JWT + bcrypt]
        ProjectsModule[Projects Module]
        TestCasesModule[Test Cases Module]
        ExecutionsModule[Executions Module]
        GitHubModule[GitHub Module]
        AIModule[AI Agent Module]
        TenantMW[Tenant Middleware]
    end

    subgraph "AI Layer"
        Claude[Claude API<br/>claude-sonnet-4-6]
        MCPServer[MCP Server<br/>:3002]
        PWRunner[Playwright Runner]
    end

    subgraph "Data Layer"
        Postgres[(PostgreSQL 15<br/>:5432)]
        Redis[(Redis 7<br/>:6379)]
    end

    subgraph "External Services"
        GitHub[GitHub API<br/>Octokit]
        Anthropic[Anthropic API]
    end

    Browser --> GHPages
    GHPages --> APIClient
    Browser --> APIClient
    APIClient --> API
    API --> TenantMW
    TenantMW --> AuthModule
    TenantMW --> ProjectsModule
    TenantMW --> TestCasesModule
    TenantMW --> ExecutionsModule
    TenantMW --> GitHubModule
    TenantMW --> AIModule
    WSGateway -.->|Real-time updates| Browser
    AuthModule --> Postgres
    ProjectsModule --> Postgres
    TestCasesModule --> Postgres
    ExecutionsModule --> Postgres
    ExecutionsModule --> PWRunner
    ExecutionsModule --> WSGateway
    GitHubModule --> GitHub
    AIModule --> Claude
    AIModule --> MCPServer
    MCPServer --> PWRunner
    AuthModule --> Redis
    ExecutionsModule --> Redis
    Claude --> Anthropic
```

## Multi-Tenant Data Isolation

```mermaid
graph LR
    subgraph "Tenant A - Acme Corp"
        UA1[User Alice]
        UA2[User Bob]
        PA[Projects A1, A2]
        TA[Test Cases T1-T10]
    end

    subgraph "Tenant B - StartupX"
        UB1[User Charlie]
        PB[Projects B1]
        TB[Test Cases T11-T15]
    end

    subgraph "PostgreSQL"
        direction TB
        Users[(users<br/>tenantId indexed)]
        Projects[(projects<br/>tenantId indexed)]
        TestCases[(test_cases<br/>tenantId indexed)]
        Executions[(executions<br/>tenantId indexed)]
    end

    subgraph "JWT Token"
        JWT["{ sub, email,<br/>tenantId, role }"]
    end

    UA1 -->|JWT with tenantId=A| JWT
    UB1 -->|JWT with tenantId=B| JWT
    JWT -->|Filter: WHERE tenantId=A| Projects
    JWT -->|Filter: WHERE tenantId=B| Projects
    PA --> Projects
    PB --> Projects
    TA --> TestCases
    TB --> TestCases
```

## AI Agent Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as NestJS API
    participant AI as AI Agent Service
    participant Claude as Claude API
    participant MCP as MCP Server
    participant PW as Playwright

    U->>FE: Click "Generate Tests"
    FE->>API: POST /ai-agent/generate-tests
    API->>AI: generateTests(url, description)
    
    AI->>Claude: Create message with tools
    
    loop Tool Use Loop
        Claude->>AI: Use tool: navigate_and_snapshot
        AI->>MCP: POST /mcp/v1/tools/call
        MCP->>PW: browser.goto(url)
        PW-->>MCP: DOM snapshot
        MCP-->>AI: { elements, forms, links }
        AI-->>Claude: Tool result
        
        Claude->>AI: Use tool: find_testable_elements
        AI->>MCP: POST /mcp/v1/tools/call
        MCP->>PW: Analyze page
        PW-->>MCP: Testable elements
        MCP-->>AI: { forms, buttons, inputs }
        AI-->>Claude: Tool result
    end
    
    Claude-->>AI: Generated test cases (JSON)
    AI->>API: Save test cases to DB
    API-->>FE: { testCases, explanation }
    FE-->>U: Display generated tests
```

## Execution Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as NestJS API
    participant ES as Executions Service
    participant PW as Playwright Runner
    participant WS as WebSocket Gateway
    participant FE as Frontend

    U->>API: POST /executions (trigger)
    API->>ES: create(dto, tenantId)
    ES->>ES: Set status = 'pending'
    API-->>U: { executionId, status: 'pending' }
    
    FE->>WS: join-execution (executionId)
    
    ES->>ES: Set status = 'running'
    WS-->>FE: execution-update { status: 'running' }
    
    loop For each test case
        ES->>PW: runTest(testCase, baseUrl)
        PW-->>ES: TestResult
        WS-->>FE: test-result { testName, status }
    end
    
    ES->>ES: Calculate pass rate
    ES->>ES: Set status = 'passed' | 'failed'
    WS-->>FE: execution-complete { summary }
```

## Database Schema

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string password
        string name
        string tenantId
        string tenantName
        enum role
        bool isActive
        timestamp createdAt
    }

    PROJECTS {
        uuid id PK
        string tenantId FK
        string name
        text description
        string githubRepo
        string githubBranch
        string baseUrl
        enum status
        int testCount
        decimal passRate
        timestamp lastRunAt
    }

    TEST_CASES {
        uuid id PK
        uuid projectId FK
        string tenantId FK
        string name
        text description
        jsonb steps
        array tags
        enum priority
        enum status
        enum lastResult
        bool generatedByAI
        text playwrightCode
    }

    EXECUTIONS {
        uuid id PK
        uuid projectId FK
        string tenantId FK
        string name
        enum status
        enum triggeredBy
        string branch
        int totalTests
        int passedTests
        int failedTests
        jsonb results
        bigint duration
        timestamp startedAt
        timestamp completedAt
    }

    GITHUB_CONFIGS {
        uuid id PK
        uuid projectId FK
        string tenantId FK
        string repoOwner
        string repoName
        string defaultBranch
        int webhookId
        bool connected
    }

    USERS ||--o{ PROJECTS : "tenantId"
    PROJECTS ||--o{ TEST_CASES : "projectId"
    PROJECTS ||--o{ EXECUTIONS : "projectId"
    PROJECTS ||--o| GITHUB_CONFIGS : "projectId"
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "GitHub"
        GHRepo[GitHub Repository]
        GHPages[GitHub Pages<br/>Static Frontend]
        GHActions[GitHub Actions CI/CD]
    end

    subgraph "Production Infrastructure"
        subgraph "Docker Compose"
            FE[Nginx + Next.js<br/>:3000]
            BE[NestJS Backend<br/>:3001]
            MCP[MCP Server<br/>:3002]
            PG[PostgreSQL<br/>:5432]
            RD[Redis<br/>:6379]
        end
    end

    GHRepo -->|Push to main| GHActions
    GHActions -->|Static Export| GHPages
    GHActions -->|Docker Build| BE
    GHPages -->|HTTPS| User
    BE -->|JWT Auth| FE
    BE --> PG
    BE --> RD
    BE --> MCP
```

## Security Model

```mermaid
graph LR
    Request[HTTP Request] -->|Bearer Token| JWTGuard[JWT Guard]
    JWTGuard -->|Decode| Payload["{ sub, tenantId, role }"]
    Payload -->|Set req.tenantId| TenantMW[Tenant Middleware]
    TenantMW -->|All queries filtered| DB[(PostgreSQL)]
    
    subgraph "Authorization Layers"
        JWTGuard
        TenantMW
        RoleGuard[Role Guard<br/>admin/member/viewer]
    end
```

## Technology Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Frontend framework | Next.js 14 App Router | Static export for GitHub Pages, server components for perf |
| State management | Zustand | Simple, TypeScript-first, minimal boilerplate |
| Backend framework | NestJS | Structured, TypeScript-native, dependency injection |
| ORM | TypeORM | PostgreSQL support, decorators, auto-sync in dev |
| Auth | JWT + bcrypt | Stateless, multi-tenant compatible |
| AI | Claude claude-sonnet-4-6 | Best in class for code generation and analysis |
| Browser automation | Playwright | Cross-browser, reliable selectors, TypeScript support |
| MCP | @modelcontextprotocol/sdk | Standard protocol for AI tool integration |
| Real-time | Socket.IO | Reliable WebSocket with fallbacks |
| Cache/Queues | Redis | Fast, reliable, supports pub/sub |
