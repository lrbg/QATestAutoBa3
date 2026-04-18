import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { MCPClientService } from './mcp-client.service';
import { TestCasesService } from '../test-cases/test-cases.service';
import { Response } from 'express';

export interface GenerateTestsDto {
  projectId: string;
  url: string;
  description: string;
  context?: string;
}

export interface ChatDto {
  message: string;
  projectId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

@Injectable()
export class AIAgentService {
  private readonly logger = new Logger(AIAgentService.name);
  private anthropic: Anthropic;

  constructor(
    private configService: ConfigService,
    private mcpClientService: MCPClientService,
    private testCasesService: TestCasesService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  async generateTests(dto: GenerateTestsDto, tenantId: string) {
    const tools = await this.mcpClientService.listTools();

    const anthropicTools: Anthropic.Tool[] = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema as Anthropic.Tool['input_schema'],
    }));

    const systemPrompt = `You are an expert QA automation engineer specializing in Playwright end-to-end testing.
Your task is to generate comprehensive test cases based on the provided URL and description.

When using tools:
1. First use navigate_and_snapshot to analyze the page
2. Use find_testable_elements to identify interactive elements
3. Use detect_user_flows to understand user journeys
4. Generate test cases covering happy paths, edge cases, and error scenarios

Always return test cases in this JSON format:
{
  "testCases": [
    {
      "name": "Test case name",
      "description": "What this test verifies",
      "priority": "critical|high|medium|low",
      "steps": [
        { "order": 1, "action": "navigate|click|fill|assert|wait", "selector": "css-selector", "value": "value", "expectedResult": "expected" }
      ],
      "tags": ["tag1", "tag2"],
      "playwrightCode": "test('name', async ({ page }) => { ... })"
    }
  ],
  "explanation": "Brief explanation of the generated tests"
}`;

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `Generate test cases for:
URL: ${dto.url}
Description: ${dto.description}
${dto.context ? `Additional context: ${dto.context}` : ''}

Please analyze the URL and generate comprehensive Playwright test cases.`,
      },
    ];

    let response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: anthropicTools,
      messages,
    });

    // Handle tool calls in an agentic loop
    while (response.stop_reason === 'tool_use') {
      const toolUses = response.content.filter((b) => b.type === 'tool_use') as Anthropic.ToolUseBlock[];

      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUses.map(async (toolUse) => {
          this.logger.log(`Calling MCP tool: ${toolUse.name}`);
          const result = await this.mcpClientService.callTool(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
          );
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: result.content.map((c) => ({
              type: 'text' as const,
              text: c.text || '',
            })),
          };
        }),
      );

      messages.push({ role: 'user', content: toolResults });

      response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        tools: anthropicTools,
        messages,
      });
    }

    // Extract JSON from response
    const textContent = response.content.find((b) => b.type === 'text') as Anthropic.TextBlock;
    const text = textContent?.text || '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Save generated test cases
        const savedCases = await Promise.all(
          parsed.testCases.map((tc: any) =>
            this.testCasesService.create(
              {
                projectId: dto.projectId,
                name: tc.name,
                description: tc.description,
                steps: tc.steps || [],
                tags: tc.tags || ['ai-generated'],
                priority: tc.priority || 'medium',
                status: 'draft',
                generatedByAI: true,
                playwrightCode: tc.playwrightCode,
              },
              tenantId,
            ),
          ),
        );

        return {
          testCases: savedCases,
          explanation: parsed.explanation || 'Tests generated successfully',
        };
      }
    } catch (err) {
      this.logger.error('Failed to parse AI response as JSON', err);
    }

    return { testCases: [], explanation: text };
  }

  async streamChat(dto: ChatDto, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const systemPrompt = `You are an expert QA automation engineer and test management assistant.
You help teams:
- Generate Playwright test cases from URLs and descriptions
- Debug and fix failing tests
- Analyze test coverage and identify gaps
- Write clean, maintainable automation code

Always provide code examples in TypeScript using Playwright's test framework.
Format code with proper syntax highlighting using markdown code blocks.`;

    const messages: Anthropic.MessageParam[] = [
      ...(dto.history || []).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: dto.message },
    ];

    try {
      const stream = await this.anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ delta: { text: chunk.delta.text } })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
    } catch (err) {
      this.logger.error('Streaming error:', err);
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    } finally {
      res.end();
    }
  }

  async analyzeResults(executionId: string, results: any[], tenantId: string): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze these test execution results and provide a concise summary with key findings and recommendations:

${JSON.stringify(results, null, 2)}

Focus on:
1. Overall pass/fail status
2. Common failure patterns
3. Suggested fixes for failing tests
4. Priority actions`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text') as Anthropic.TextBlock;
    return textBlock?.text || 'Analysis unavailable';
  }
}
