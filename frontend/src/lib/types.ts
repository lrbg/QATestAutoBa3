// ============================================================
// Core Domain Types
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  githubRepo?: string;
  githubBranch?: string;
  baseUrl?: string;
  status: 'active' | 'archived';
  testCount: number;
  lastRunAt?: string;
  passRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  projectId: string;
  tenantId: string;
  name: string;
  description: string;
  steps: TestStep[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'archived';
  lastResult?: 'passed' | 'failed' | 'skipped' | 'error';
  lastRunAt?: string;
  generatedByAI: boolean;
  playwrightCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestStep {
  id: string;
  order: number;
  action: string;
  selector?: string;
  value?: string;
  expectedResult?: string;
}

export interface Execution {
  id: string;
  projectId: string;
  tenantId: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'cancelled';
  triggeredBy: 'manual' | 'github' | 'scheduled' | 'ai';
  branch?: string;
  commitSha?: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration?: number;
  results: TestResult[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TestResult {
  id: string;
  executionId: string;
  testCaseId: string;
  testCaseName: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration?: number;
  errorMessage?: string;
  screenshot?: string;
  logs: string[];
  steps: StepResult[];
}

export interface StepResult {
  order: number;
  action: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  errorMessage?: string;
  screenshot?: string;
}

export interface GitHubConfig {
  id: string;
  projectId: string;
  tenantId: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  webhookId?: number;
  connected: boolean;
  lastSyncAt?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface AISession {
  id: string;
  projectId?: string;
  messages: AIMessage[];
  context?: string;
  createdAt: string;
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  tenantName: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  baseUrl?: string;
  githubRepo?: string;
}

export interface CreateTestCaseRequest {
  projectId: string;
  name: string;
  description: string;
  steps: Omit<TestStep, 'id'>[];
  tags: string[];
  priority: TestCase['priority'];
  playwrightCode?: string;
}

export interface TriggerExecutionRequest {
  projectId: string;
  testCaseIds?: string[];
  branch?: string;
}

export interface GenerateTestsRequest {
  projectId: string;
  url: string;
  description: string;
  context?: string;
}

export interface AIGenerateResponse {
  testCases: Omit<TestCase, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[];
  explanation: string;
}

// ============================================================
// Dashboard Stats Types
// ============================================================

export interface DashboardStats {
  totalProjects: number;
  totalTests: number;
  totalExecutions: number;
  overallPassRate: number;
  recentExecutions: Execution[];
  testsByStatus: {
    active: number;
    draft: number;
    archived: number;
  };
  executionTrend: {
    date: string;
    passed: number;
    failed: number;
    total: number;
  }[];
}

// ============================================================
// UI State Types
// ============================================================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
