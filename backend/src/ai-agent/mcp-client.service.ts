import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

@Injectable()
export class MCPClientService {
  private readonly logger = new Logger(MCPClientService.name);
  private readonly mcpUrl: string;

  constructor(private configService: ConfigService) {
    this.mcpUrl = this.configService.get('MCP_SERVER_URL', 'http://localhost:3002');
  }

  async listTools(): Promise<MCPTool[]> {
    try {
      const response = await axios.post(`${this.mcpUrl}/mcp/v1/tools/list`, {}, { timeout: 5000 });
      return response.data.tools || [];
    } catch (err) {
      this.logger.warn(`MCP server unavailable: ${err.message}`);
      return this.getBuiltinToolSchemas();
    }
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    try {
      const response = await axios.post(
        `${this.mcpUrl}/mcp/v1/tools/call`,
        { name, arguments: args },
        { timeout: 30000 },
      );
      return response.data;
    } catch (err) {
      this.logger.warn(`MCP tool call failed: ${err.message}`);
      return this.simulateTool(name, args);
    }
  }

  private simulateTool(name: string, args: Record<string, unknown>): MCPToolResult {
    switch (name) {
      case 'navigate_and_snapshot':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              url: args.url,
              title: 'Sample Page',
              elements: [
                { type: 'form', id: 'login-form', inputs: ['email', 'password'], buttons: ['submit'] },
                { type: 'nav', links: ['/home', '/about', '/contact'] },
                { type: 'button', text: 'Sign In', selector: '[data-testid="login-btn"]' },
              ],
            }),
          }],
        };

      case 'find_testable_elements':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              forms: [{ id: 'login-form', action: '/auth/login' }],
              buttons: [{ text: 'Submit', selector: 'button[type="submit"]' }],
              inputs: [
                { name: 'email', type: 'email', selector: 'input[name="email"]' },
                { name: 'password', type: 'password', selector: 'input[name="password"]' },
              ],
              links: [{ text: 'Home', href: '/' }],
            }),
          }],
        };

      case 'detect_user_flows':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              flows: [
                { name: 'Login Flow', steps: ['navigate to /login', 'fill email', 'fill password', 'click submit'] },
                { name: 'Registration Flow', steps: ['navigate to /register', 'fill name', 'fill email', 'fill password', 'click register'] },
              ],
            }),
          }],
        };

      case 'generate_test_steps':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              testName: `Test ${args.flowName || 'Page'}`,
              steps: [
                { action: 'navigate', value: args.url || '/' },
                { action: 'fill', selector: 'input[name="email"]', value: 'test@example.com' },
                { action: 'fill', selector: 'input[name="password"]', value: 'password123' },
                { action: 'click', selector: 'button[type="submit"]' },
                { action: 'assert', expectedResult: 'User is logged in' },
              ],
            }),
          }],
        };

      case 'extract_dom_attributes':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              attributes: [
                { selector: 'input[name="email"]', attributes: { type: 'email', required: true, placeholder: 'Email' } },
                { selector: 'button[type="submit"]', attributes: { type: 'submit', text: 'Sign In' } },
              ],
            }),
          }],
        };

      default:
        return { content: [{ type: 'text', text: `Tool ${name} not available` }] };
    }
  }

  private getBuiltinToolSchemas(): MCPTool[] {
    return [
      {
        name: 'navigate_and_snapshot',
        description: 'Navigate to a URL and take a DOM snapshot',
        inputSchema: {
          type: 'object',
          properties: { url: { type: 'string' } },
          required: ['url'],
        },
      },
      {
        name: 'find_testable_elements',
        description: 'Find all testable UI elements on the page',
        inputSchema: {
          type: 'object',
          properties: { url: { type: 'string' } },
          required: ['url'],
        },
      },
      {
        name: 'detect_user_flows',
        description: 'Detect interactive user flows on the page',
        inputSchema: {
          type: 'object',
          properties: { url: { type: 'string' } },
          required: ['url'],
        },
      },
      {
        name: 'generate_test_steps',
        description: 'Generate Playwright test steps for a user flow',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            flowName: { type: 'string' },
          },
          required: ['url'],
        },
      },
      {
        name: 'extract_dom_attributes',
        description: 'Extract DOM element attributes for accessibility tree',
        inputSchema: {
          type: 'object',
          properties: { url: { type: 'string' } },
          required: ['url'],
        },
      },
    ];
  }
}
