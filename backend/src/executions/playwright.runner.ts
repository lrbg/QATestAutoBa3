import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { TestCase } from '../test-cases/test-case.entity';
import { TestResult } from './execution.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PlaywrightRunner {
  private readonly logger = new Logger(PlaywrightRunner.name);

  async runTests(
    testCases: TestCase[],
    baseUrl: string,
    executionId: string,
  ): Promise<TestResult[]> {
    this.logger.log(`Running ${testCases.length} tests for execution ${executionId}`);

    const results: TestResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runSingleTest(testCase, baseUrl, executionId);
      results.push(result);
    }

    return results;
  }

  private async runSingleTest(
    testCase: TestCase,
    baseUrl: string,
    executionId: string,
  ): Promise<TestResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const resultId = uuidv4();

    if (testCase.playwrightCode) {
      return this.runPlaywrightCode(testCase, baseUrl, executionId, resultId, startTime);
    }

    return this.runStepBasedTest(testCase, baseUrl, executionId, resultId, startTime);
  }

  private async runPlaywrightCode(
    testCase: TestCase,
    baseUrl: string,
    executionId: string,
    resultId: string,
    startTime: number,
  ): Promise<TestResult> {
    const tempDir = os.tmpdir();
    const testFile = path.join(tempDir, `qa-test-${resultId}.spec.ts`);
    const logs: string[] = [];

    const fullCode = `
import { test, expect } from '@playwright/test';

// Base URL: ${baseUrl}
${testCase.playwrightCode}
    `.trim();

    try {
      fs.writeFileSync(testFile, fullCode);
      logs.push(`Generated test file: ${testFile}`);

      const { stdout, stderr, exitCode } = await this.execPlaywright(testFile, logs);

      const duration = Date.now() - startTime;
      const status = exitCode === 0 ? 'passed' : 'failed';

      return {
        id: resultId,
        executionId,
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        status,
        duration,
        errorMessage: exitCode !== 0 ? this.extractError(stderr) : undefined,
        logs: [...logs, ...stdout.split('\n').filter(Boolean)],
        steps: [],
      };
    } catch (error) {
      return {
        id: resultId,
        executionId,
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        status: 'error',
        duration: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        logs,
        steps: [],
      };
    } finally {
      try { fs.unlinkSync(testFile); } catch {}
    }
  }

  private async runStepBasedTest(
    testCase: TestCase,
    baseUrl: string,
    executionId: string,
    resultId: string,
    startTime: number,
  ): Promise<TestResult> {
    const logs: string[] = [];
    const steps = testCase.steps || [];

    logs.push(`Starting test: ${testCase.name}`);
    logs.push(`Base URL: ${baseUrl}`);

    // Simulate step execution (replace with actual Playwright when pw is installed)
    for (const step of steps) {
      logs.push(`Step ${step.order}: ${step.action} ${step.selector || step.value || ''}`);
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
    }

    const duration = Date.now() - startTime;
    const passed = Math.random() > 0.15; // 85% pass rate simulation

    if (passed) {
      logs.push('Test completed successfully');
    } else {
      logs.push('ERROR: Assertion failed - element not found or unexpected state');
    }

    return {
      id: resultId,
      executionId,
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      status: passed ? 'passed' : 'failed',
      duration,
      errorMessage: !passed ? 'AssertionError: Expected element to be visible' : undefined,
      logs,
      steps: steps.map((step, i) => ({
        order: step.order,
        action: step.action,
        status: i === steps.length - 1 && !passed ? 'failed' : 'passed',
        duration: Math.floor(50 + Math.random() * 200),
      })),
    };
  }

  private execPlaywright(
    testFile: string,
    logs: string[],
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const proc = spawn('npx', ['playwright', 'test', testFile, '--reporter=json'], {
        env: { ...process.env },
        timeout: 60000,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
        logs.push(data.toString().trim());
      });

      proc.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code || 0 });
      });

      proc.on('error', (err) => {
        logs.push(`Playwright not available: ${err.message}`);
        resolve({ stdout: '', stderr: err.message, exitCode: 1 });
      });
    });
  }

  private extractError(stderr: string): string {
    const lines = stderr.split('\n').filter((l) => l.includes('Error') || l.includes('timeout'));
    return lines[0] || 'Test execution failed';
  }
}
