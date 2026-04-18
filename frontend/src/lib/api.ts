import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Project,
  CreateProjectRequest,
  TestCase,
  CreateTestCaseRequest,
  Execution,
  TriggerExecutionRequest,
  DashboardStats,
  GitHubConfig,
  GenerateTestsRequest,
  AIGenerateResponse,
} from './types';
import {
  MOCK_PROJECTS,
  MOCK_TEST_CASES,
  MOCK_EXECUTIONS,
  MOCK_DASHBOARD_STATS,
  MOCK_USER,
  MOCK_GITHUB_CONFIG,
} from './mock-data';

const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === 'true' ||
  !process.env.NEXT_PUBLIC_API_URL ||
  typeof window !== 'undefined' && window.location.hostname.includes('github.io');

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('qa_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('qa_token');
            localStorage.removeItem('qa_user');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================
  // Auth
  // ============================================================

  async login(data: LoginRequest): Promise<AuthResponse> {
    if (USE_MOCK) {
      await delay();
      return {
        access_token: 'mock-jwt-token-demo',
        user: MOCK_USER,
      };
    }
    const res = await this.client.post<AuthResponse>('/auth/login', data);
    return res.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (USE_MOCK) {
      await delay();
      return {
        access_token: 'mock-jwt-token-demo',
        user: { ...MOCK_USER, name: data.name, email: data.email },
      };
    }
    const res = await this.client.post<AuthResponse>('/auth/register', data);
    return res.data;
  }

  async getProfile() {
    if (USE_MOCK) {
      await delay(200);
      return MOCK_USER;
    }
    const res = await this.client.get('/auth/profile');
    return res.data;
  }

  // ============================================================
  // Dashboard
  // ============================================================

  async getDashboardStats(): Promise<DashboardStats> {
    if (USE_MOCK) {
      await delay();
      return MOCK_DASHBOARD_STATS;
    }
    const res = await this.client.get<DashboardStats>('/dashboard/stats');
    return res.data;
  }

  // ============================================================
  // Projects
  // ============================================================

  async getProjects(): Promise<Project[]> {
    if (USE_MOCK) {
      await delay();
      return MOCK_PROJECTS;
    }
    const res = await this.client.get<Project[]>('/projects');
    return res.data;
  }

  async getProject(id: string): Promise<Project> {
    if (USE_MOCK) {
      await delay();
      const project = MOCK_PROJECTS.find((p) => p.id === id);
      if (!project) throw new Error('Project not found');
      return project;
    }
    const res = await this.client.get<Project>(`/projects/${id}`);
    return res.data;
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    if (USE_MOCK) {
      await delay(600);
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        ...data,
        tenantId: 'tenant-1',
        status: 'active',
        testCount: 0,
        passRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newProject;
    }
    const res = await this.client.post<Project>('/projects', data);
    return res.data;
  }

  async updateProject(id: string, data: Partial<CreateProjectRequest>): Promise<Project> {
    if (USE_MOCK) {
      await delay(400);
      const project = MOCK_PROJECTS.find((p) => p.id === id)!;
      return { ...project, ...data, updatedAt: new Date().toISOString() };
    }
    const res = await this.client.put<Project>(`/projects/${id}`, data);
    return res.data;
  }

  async deleteProject(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay(300);
      return;
    }
    await this.client.delete(`/projects/${id}`);
  }

  // ============================================================
  // Test Cases
  // ============================================================

  async getTestCases(projectId?: string): Promise<TestCase[]> {
    if (USE_MOCK) {
      await delay();
      return projectId
        ? MOCK_TEST_CASES.filter((tc) => tc.projectId === projectId)
        : MOCK_TEST_CASES;
    }
    const params = projectId ? { projectId } : {};
    const res = await this.client.get<TestCase[]>('/test-cases', { params });
    return res.data;
  }

  async getTestCase(id: string): Promise<TestCase> {
    if (USE_MOCK) {
      await delay();
      const tc = MOCK_TEST_CASES.find((t) => t.id === id);
      if (!tc) throw new Error('Test case not found');
      return tc;
    }
    const res = await this.client.get<TestCase>(`/test-cases/${id}`);
    return res.data;
  }

  async createTestCase(data: CreateTestCaseRequest): Promise<TestCase> {
    if (USE_MOCK) {
      await delay(600);
      return {
        id: `tc-${Date.now()}`,
        ...data,
        steps: data.steps.map((s, i) => ({ ...s, id: `step-${Date.now()}-${i}` })),
        status: 'active' as const,
        tenantId: 'tenant-1',
        generatedByAI: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const res = await this.client.post<TestCase>('/test-cases', data);
    return res.data;
  }

  async updateTestCase(id: string, data: Partial<CreateTestCaseRequest>): Promise<TestCase> {
    if (USE_MOCK) {
      await delay(400);
      const tc = MOCK_TEST_CASES.find((t) => t.id === id)!;
      const steps = data.steps
        ? data.steps.map((s, i) => ({ ...s, id: `step-${Date.now()}-${i}` }))
        : tc.steps;
      return { ...tc, ...data, steps, updatedAt: new Date().toISOString() };
    }
    const res = await this.client.put<TestCase>(`/test-cases/${id}`, data);
    return res.data;
  }

  async deleteTestCase(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay(300);
      return;
    }
    await this.client.delete(`/test-cases/${id}`);
  }

  // ============================================================
  // Executions
  // ============================================================

  async getExecutions(projectId?: string): Promise<Execution[]> {
    if (USE_MOCK) {
      await delay();
      return projectId
        ? MOCK_EXECUTIONS.filter((e) => e.projectId === projectId)
        : MOCK_EXECUTIONS;
    }
    const params = projectId ? { projectId } : {};
    const res = await this.client.get<Execution[]>('/executions', { params });
    return res.data;
  }

  async getExecution(id: string): Promise<Execution> {
    if (USE_MOCK) {
      await delay();
      const exec = MOCK_EXECUTIONS.find((e) => e.id === id);
      if (!exec) throw new Error('Execution not found');
      return exec;
    }
    const res = await this.client.get<Execution>(`/executions/${id}`);
    return res.data;
  }

  async triggerExecution(data: TriggerExecutionRequest): Promise<Execution> {
    if (USE_MOCK) {
      await delay(800);
      return {
        id: `exec-${Date.now()}`,
        ...data,
        tenantId: 'tenant-1',
        name: 'Manual Test Run',
        status: 'pending',
        triggeredBy: 'manual',
        totalTests: data.testCaseIds?.length || 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        results: [],
        createdAt: new Date().toISOString(),
      };
    }
    const res = await this.client.post<Execution>('/executions', data);
    return res.data;
  }

  // ============================================================
  // GitHub
  // ============================================================

  async getGitHubConfig(projectId: string): Promise<GitHubConfig | null> {
    if (USE_MOCK) {
      await delay();
      return MOCK_GITHUB_CONFIG.projectId === projectId ? MOCK_GITHUB_CONFIG : null;
    }
    const res = await this.client.get<GitHubConfig>(`/github/config/${projectId}`);
    return res.data;
  }

  async connectGitHub(projectId: string, repoOwner: string, repoName: string): Promise<GitHubConfig> {
    if (USE_MOCK) {
      await delay(800);
      return { ...MOCK_GITHUB_CONFIG, projectId, repoOwner, repoName };
    }
    const res = await this.client.post<GitHubConfig>('/github/connect', { projectId, repoOwner, repoName });
    return res.data;
  }

  async getGitHubBranches(projectId: string): Promise<string[]> {
    if (USE_MOCK) {
      await delay();
      return ['main', 'develop', 'feature/new-checkout', 'feature/auth-improvements', 'hotfix/payment-bug'];
    }
    const res = await this.client.get<string[]>(`/github/branches/${projectId}`);
    return res.data;
  }

  // ============================================================
  // AI Agent
  // ============================================================

  async generateTests(data: GenerateTestsRequest): Promise<AIGenerateResponse> {
    if (USE_MOCK) {
      await delay(2000);
      return {
        testCases: [
          {
            projectId: data.projectId,
            name: 'AI Generated: Page Load Test',
            description: `Verify the page at ${data.url} loads correctly`,
            steps: [
              { id: 's1', order: 1, action: 'navigate', value: data.url, expectedResult: 'Page loads without errors' },
              { id: 's2', order: 2, action: 'assert', selector: 'body', expectedResult: 'Body is visible' },
            ],
            tags: ['ai-generated', 'smoke'],
            priority: 'medium',
            status: 'draft' as const,
            generatedByAI: true,
          },
        ],
        explanation: `I analyzed the URL ${data.url} and generated test cases based on common web application patterns and your description: "${data.description}". The tests cover page load verification, form interactions, and navigation flows.`,
      };
    }
    const res = await this.client.post<AIGenerateResponse>('/ai-agent/generate-tests', data);
    return res.data;
  }

  async chatWithAgent(message: string, projectId?: string, history?: { role: string; content: string }[]): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('qa_token') : null;
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai-agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, projectId, history }),
    });
  }
}

export const api = new ApiClient();
export { USE_MOCK };
