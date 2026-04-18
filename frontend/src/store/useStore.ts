import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  Project,
  TestCase,
  Execution,
  Notification,
  AIMessage,
} from '@/lib/types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;

  // Projects
  projects: Project[];
  selectedProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  removeProject: (id: string) => void;

  // Test Cases
  testCases: TestCase[];
  setTestCases: (testCases: TestCase[]) => void;
  addTestCase: (testCase: TestCase) => void;
  updateTestCase: (id: string, testCase: Partial<TestCase>) => void;
  removeTestCase: (id: string) => void;

  // Executions
  executions: Execution[];
  activeExecution: Execution | null;
  setExecutions: (executions: Execution[]) => void;
  setActiveExecution: (execution: Execution | null) => void;
  updateExecution: (id: string, execution: Partial<Execution>) => void;

  // AI Agent
  aiMessages: AIMessage[];
  aiSessionId: string | null;
  addAIMessage: (message: AIMessage) => void;
  updateLastAIMessage: (content: string) => void;
  clearAIChat: () => void;
  setAISessionId: (id: string | null) => void;

  // UI
  notifications: Notification[];
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('qa_token', token);
          localStorage.setItem('qa_user', JSON.stringify(user));
        }
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('qa_token');
          localStorage.removeItem('qa_user');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Projects
      projects: [],
      selectedProject: null,
      setProjects: (projects) => set({ projects }),
      setSelectedProject: (project) => set({ selectedProject: project }),
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
          selectedProject:
            state.selectedProject?.id === id
              ? { ...state.selectedProject, ...updates }
              : state.selectedProject,
        })),
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          selectedProject:
            state.selectedProject?.id === id ? null : state.selectedProject,
        })),

      // Test Cases
      testCases: [],
      setTestCases: (testCases) => set({ testCases }),
      addTestCase: (testCase) =>
        set((state) => ({ testCases: [...state.testCases, testCase] })),
      updateTestCase: (id, updates) =>
        set((state) => ({
          testCases: state.testCases.map((tc) =>
            tc.id === id ? { ...tc, ...updates } : tc
          ),
        })),
      removeTestCase: (id) =>
        set((state) => ({
          testCases: state.testCases.filter((tc) => tc.id !== id),
        })),

      // Executions
      executions: [],
      activeExecution: null,
      setExecutions: (executions) => set({ executions }),
      setActiveExecution: (execution) => set({ activeExecution: execution }),
      updateExecution: (id, updates) =>
        set((state) => ({
          executions: state.executions.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
          activeExecution:
            state.activeExecution?.id === id
              ? { ...state.activeExecution, ...updates }
              : state.activeExecution,
        })),

      // AI Agent
      aiMessages: [],
      aiSessionId: null,
      addAIMessage: (message) =>
        set((state) => ({ aiMessages: [...state.aiMessages, message] })),
      updateLastAIMessage: (content) =>
        set((state) => {
          const messages = [...state.aiMessages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
              isStreaming: false,
            };
          }
          return { aiMessages: messages };
        }),
      clearAIChat: () => set({ aiMessages: [], aiSessionId: null }),
      setAISessionId: (id) => set({ aiSessionId: id }),

      // UI
      notifications: [],
      sidebarCollapsed: false,
      theme: 'dark',
      addNotification: (notification) => {
        const id = `notif-${Date.now()}`;
        const newNotif: Notification = {
          id,
          ...notification,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [...state.notifications.slice(-4), newNotif],
        }));
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        }, 5000);
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'qa-platform-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
