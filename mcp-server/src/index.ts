import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { chromium, Browser, Page } from 'playwright';
import { z } from 'zod';

// ============================================================
// Tool Definitions
// ============================================================

const tools: Tool[] = [
  {
    name: 'navigate_and_snapshot',
    description: 'Navigate to a URL and capture a complete DOM snapshot with accessibility tree',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to navigate to' },
        waitFor: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle'],
          default: 'networkidle',
          description: 'Wait condition for navigation',
        },
        timeout: { type: 'number', default: 30000, description: 'Navigation timeout in ms' },
      },
      required: ['url'],
    },
  },
  {
    name: 'find_testable_elements',
    description: 'Find all testable UI elements on the page including forms, buttons, inputs, and links',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to analyze' },
        includeHidden: { type: 'boolean', default: false, description: 'Include hidden elements' },
      },
      required: ['url'],
    },
  },
  {
    name: 'detect_user_flows',
    description: 'Detect and map interactive user flows and journeys on a page',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to analyze' },
        maxDepth: { type: 'number', default: 3, description: 'Maximum navigation depth' },
      },
      required: ['url'],
    },
  },
  {
    name: 'generate_test_steps',
    description: 'Generate detailed Playwright test steps for a specific user flow',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to test' },
        flowName: { type: 'string', description: 'Name of the user flow to test' },
        flowDescription: { type: 'string', description: 'Description of the user flow' },
        elements: {
          type: 'array',
          items: { type: 'object' },
          description: 'Elements discovered from find_testable_elements',
        },
      },
      required: ['url', 'flowName'],
    },
  },
  {
    name: 'extract_dom_attributes',
    description: 'Extract DOM element attributes including ARIA roles, labels, and accessibility attributes',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to analyze' },
        selectors: {
          type: 'array',
          items: { type: 'string' },
          description: 'CSS selectors to extract attributes for (empty = all interactive elements)',
        },
      },
      required: ['url'],
    },
  },
];

// ============================================================
// Browser Management
// ============================================================

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    });
  }
  return browser;
}

async function withPage<T>(
  url: string,
  fn: (page: Page) => Promise<T>,
  waitFor: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle',
  timeout = 30000,
): Promise<T> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: waitFor, timeout });
    return await fn(page);
  } finally {
    await page.close();
  }
}

// ============================================================
// Tool Implementations
// ============================================================

async function navigateAndSnapshot(
  url: string,
  waitFor: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle',
  timeout = 30000,
) {
  return withPage(
    url,
    async (page) => {
      const title = await page.title();

      // Get page structure
      const structure = await page.evaluate(() => {
        function getElementInfo(el: Element, depth = 0): any {
          if (depth > 5) return null;

          const tag = el.tagName.toLowerCase();
          const attrs: Record<string, string> = {};

          for (const attr of el.attributes) {
            attrs[attr.name] = attr.value;
          }

          const children = Array.from(el.children)
            .slice(0, 10)
            .map((child) => getElementInfo(child, depth + 1))
            .filter(Boolean);

          return {
            tag,
            id: el.id || undefined,
            classes: el.className ? el.className.split(' ').filter(Boolean).slice(0, 5) : undefined,
            attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
            text: el.textContent?.trim().slice(0, 100) || undefined,
            children: children.length > 0 ? children : undefined,
          };
        }

        return getElementInfo(document.body);
      });

      // Get interactive elements
      const interactiveElements = await page.evaluate(() => {
        const selectors = ['button', 'a[href]', 'input', 'select', 'textarea', 'form', '[role="button"]', '[onclick]'];
        const elements: any[] = [];

        for (const selector of selectors) {
          const found = Array.from(document.querySelectorAll(selector)).slice(0, 20);
          for (const el of found) {
            elements.push({
              type: el.tagName.toLowerCase(),
              selector: el.id
                ? `#${el.id}`
                : el.getAttribute('data-testid')
                ? `[data-testid="${el.getAttribute('data-testid')}"]`
                : el.getAttribute('name')
                ? `[name="${el.getAttribute('name')}"]`
                : el.tagName.toLowerCase(),
              text: el.textContent?.trim().slice(0, 50),
              href: el.getAttribute('href'),
              type_attr: el.getAttribute('type'),
              placeholder: el.getAttribute('placeholder'),
              'aria-label': el.getAttribute('aria-label'),
            });
          }
        }

        return elements;
      });

      return {
        url,
        title,
        structure,
        interactiveElements,
        timestamp: new Date().toISOString(),
      };
    },
    waitFor,
    timeout,
  );
}

async function findTestableElements(url: string, includeHidden = false) {
  return withPage(url, async (page) => {
    return page.evaluate((includeHidden: boolean) => {
      const isVisible = (el: Element): boolean => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      };

      const forms = Array.from(document.querySelectorAll('form')).map((form) => ({
        id: form.id,
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input, select, textarea')).map((input) => ({
          name: input.getAttribute('name'),
          type: input.getAttribute('type') || input.tagName.toLowerCase(),
          placeholder: input.getAttribute('placeholder'),
          required: input.hasAttribute('required'),
          selector: input.id ? `#${input.id}` : `[name="${input.getAttribute('name')}"]`,
        })),
        buttons: Array.from(form.querySelectorAll('button, input[type="submit"]')).map((btn) => ({
          text: btn.textContent?.trim(),
          type: btn.getAttribute('type'),
          selector: btn.id ? `#${btn.id}` : btn.getAttribute('data-testid') ? `[data-testid="${btn.getAttribute('data-testid')}"]` : 'button[type="submit"]',
        })),
      }));

      const buttons = Array.from(document.querySelectorAll('button:not(form button), [role="button"]'))
        .filter((el) => includeHidden || isVisible(el))
        .map((btn) => ({
          text: btn.textContent?.trim().slice(0, 50),
          selector: btn.id ? `#${btn.id}` : btn.getAttribute('data-testid') ? `[data-testid="${btn.getAttribute('data-testid')}"]` : btn.getAttribute('class') ? `.${btn.getAttribute('class')?.split(' ')[0]}` : 'button',
          ariaLabel: btn.getAttribute('aria-label'),
          disabled: btn.hasAttribute('disabled'),
        }));

      const links = Array.from(document.querySelectorAll('a[href]'))
        .filter((el) => includeHidden || isVisible(el))
        .map((link) => ({
          text: link.textContent?.trim().slice(0, 50),
          href: link.getAttribute('href'),
          selector: link.id ? `#${link.id}` : `a[href="${link.getAttribute('href')}"]`,
        }));

      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'))
        .filter((el) => includeHidden || isVisible(el))
        .map((input) => ({
          name: input.getAttribute('name'),
          type: input.getAttribute('type') || input.tagName.toLowerCase(),
          placeholder: input.getAttribute('placeholder'),
          selector: input.id ? `#${input.id}` : `[name="${input.getAttribute('name')}"]`,
          label: input.id
            ? document.querySelector(`label[for="${input.id}"]`)?.textContent?.trim()
            : undefined,
        }));

      return { forms, buttons, links, inputs, total: forms.length + buttons.length + links.length + inputs.length };
    }, includeHidden);
  });
}

async function detectUserFlows(url: string, maxDepth = 3) {
  return withPage(url, async (page) => {
    // Analyze page structure to detect common flows
    const flows = await page.evaluate(() => {
      const flows: any[] = [];

      // Login flow detection
      const loginForm = document.querySelector('form[action*="login"], form[action*="signin"], #login-form, #signin-form');
      if (loginForm) {
        flows.push({
          name: 'User Login',
          type: 'authentication',
          priority: 'critical',
          steps: [
            'Navigate to login page',
            'Fill email/username field',
            'Fill password field',
            'Click submit button',
            'Verify successful redirect',
          ],
          elements: {
            emailInput: loginForm.querySelector('input[type="email"], input[name*="email"], input[name*="username"]')?.getAttribute('name'),
            passwordInput: loginForm.querySelector('input[type="password"]')?.getAttribute('name'),
            submitButton: loginForm.querySelector('button[type="submit"], input[type="submit"]')?.textContent?.trim(),
          },
        });
      }

      // Registration flow
      const registerForm = document.querySelector('form[action*="register"], form[action*="signup"], #register-form');
      if (registerForm) {
        flows.push({
          name: 'User Registration',
          type: 'authentication',
          priority: 'high',
          steps: [
            'Navigate to registration page',
            'Fill all required fields',
            'Submit registration form',
            'Verify account created',
          ],
        });
      }

      // Search flow
      const searchInput = document.querySelector('input[type="search"], input[name*="search"], input[placeholder*="search" i]');
      if (searchInput) {
        flows.push({
          name: 'Search Functionality',
          type: 'navigation',
          priority: 'high',
          steps: [
            'Locate search input',
            'Type search query',
            'Submit search (Enter or button click)',
            'Verify search results displayed',
          ],
        });
      }

      // Navigation flow
      const navLinks = Array.from(document.querySelectorAll('nav a, header a')).slice(0, 5);
      if (navLinks.length > 0) {
        flows.push({
          name: 'Navigation Menu',
          type: 'navigation',
          priority: 'medium',
          steps: navLinks.map((link) => `Click "${link.textContent?.trim()}" and verify navigation`),
        });
      }

      return flows;
    });

    return {
      url,
      detectedFlows: flows,
      pageType: flows.some((f) => f.type === 'authentication') ? 'auth' : 'content',
      timestamp: new Date().toISOString(),
    };
  });
}

async function generateTestSteps(
  url: string,
  flowName: string,
  flowDescription?: string,
  elements?: any[],
) {
  const pageData = await findTestableElements(url);

  const testCode = `import { test, expect } from '@playwright/test';

test('${flowName}', async ({ page }) => {
  // Navigate to the page
  await page.goto('${url}');

  // Wait for page to be ready
  await page.waitForLoadState('networkidle');

  // TODO: Add specific assertions based on page analysis
  // Page title check
  await expect(page).toHaveTitle(/.+/);

  // Verify key elements are visible
  ${(pageData as any).inputs?.slice(0, 3).map((input: any) => `await expect(page.locator('${input.selector}')).toBeVisible();`).join('\n  ')}

  // Interact with form if present
  ${
    (pageData as any).forms?.[0]
      ? `const form = page.locator('form').first();
  await expect(form).toBeVisible();

  // Fill form fields
  ${(pageData as any).forms[0].inputs?.map((input: any) => `// await page.fill('${input.selector}', 'test-value');`).join('\n  ')}

  // Submit form
  // await page.click('${(pageData as any).forms[0].buttons?.[0]?.selector || "button[type='submit']"}');`
      : '// No forms detected on this page'
  }
});`;

  return {
    flowName,
    url,
    testCode,
    steps: [
      { order: 1, action: 'navigate', value: url, expectedResult: 'Page loads' },
      { order: 2, action: 'assert', selector: 'body', expectedResult: 'Page body is visible' },
      ...((pageData as any).inputs?.slice(0, 3).map((input: any, i: number) => ({
        order: 3 + i,
        action: 'fill',
        selector: input.selector,
        value: `test-${input.name || 'value'}`,
      })) || []),
      {
        order: 10,
        action: 'screenshot',
        value: `${flowName.toLowerCase().replace(/\s+/g, '-')}.png`,
        expectedResult: 'Screenshot captured',
      },
    ],
  };
}

async function extractDomAttributes(url: string, selectors?: string[]) {
  return withPage(url, async (page) => {
    return page.evaluate((selectors: string[]) => {
      const defaultSelectors = selectors?.length > 0
        ? selectors
        : ['button', 'input', 'a', 'select', '[role]', '[aria-label]'];

      const results: any[] = [];

      for (const selector of defaultSelectors) {
        const elements = Array.from(document.querySelectorAll(selector)).slice(0, 10);
        for (const el of elements) {
          const attrs: Record<string, string> = {};
          for (const attr of el.attributes) {
            attrs[attr.name] = attr.value;
          }

          results.push({
            selector,
            tag: el.tagName.toLowerCase(),
            attributes: attrs,
            textContent: el.textContent?.trim().slice(0, 100),
            accessibilityRole: el.getAttribute('role') || el.tagName.toLowerCase(),
            isVisible: el.getBoundingClientRect().width > 0,
          });
        }
      }

      return { elements: results, total: results.length };
    }, selectors || []);
  });
}

// ============================================================
// MCP Server Setup
// ============================================================

const mcpServer = new Server(
  {
    name: 'qa-platform-playwright-mcp',
    version: '1.0.0',
  },
  {
    capabilities: { tools: {} },
  },
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: any;

    switch (name) {
      case 'navigate_and_snapshot':
        result = await navigateAndSnapshot(
          args.url as string,
          (args.waitFor as any) || 'networkidle',
          (args.timeout as number) || 30000,
        );
        break;

      case 'find_testable_elements':
        result = await findTestableElements(args.url as string, args.includeHidden as boolean);
        break;

      case 'detect_user_flows':
        result = await detectUserFlows(args.url as string, args.maxDepth as number);
        break;

      case 'generate_test_steps':
        result = await generateTestSteps(
          args.url as string,
          args.flowName as string,
          args.flowDescription as string,
          args.elements as any[],
        );
        break;

      case 'extract_dom_attributes':
        result = await extractDomAttributes(args.url as string, args.selectors as string[]);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error executing ${name}: ${message}` }],
      isError: true,
    };
  }
});

// ============================================================
// HTTP API (for backend to call)
// ============================================================

const app = express();
app.use(express.json());

app.post('/mcp/v1/tools/list', (req, res) => {
  res.json({ tools });
});

app.post('/mcp/v1/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body;

  try {
    const response = await mcpServer.request(
      { method: 'tools/call', params: { name, arguments: args } },
      CallToolRequestSchema,
    );
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', tools: tools.length });
});

// ============================================================
// Start
// ============================================================

const PORT = process.env.PORT || 3002;

// Start HTTP server
app.listen(PORT, () => {
  console.log(`MCP Server HTTP API running on http://localhost:${PORT}`);
  console.log(`Available tools: ${tools.map((t) => t.name).join(', ')}`);
});

// Also support stdio transport for direct MCP communication
if (process.env.MCP_STDIO === 'true') {
  const transport = new StdioServerTransport();
  mcpServer.connect(transport).then(() => {
    console.error('MCP Server running on stdio');
  });
}

// Cleanup on exit
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (browser) await browser.close();
  process.exit(0);
});
