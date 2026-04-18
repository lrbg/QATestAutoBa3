import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { TestCasesService } from '../test-cases/test-cases.service';
import { ExecutionsService } from '../executions/executions.service';

@Injectable()
export class DashboardService {
  constructor(
    private projectsService: ProjectsService,
    private testCasesService: TestCasesService,
    private executionsService: ExecutionsService,
  ) {}

  async getStats(tenantId: string) {
    const [projects, testCases, executions] = await Promise.all([
      this.projectsService.findAll(tenantId),
      this.testCasesService.findAll(tenantId),
      this.executionsService.findAll(tenantId),
    ]);

    const totalTests = testCases.length;
    const totalProjects = projects.length;
    const totalExecutions = executions.length;

    // Calculate overall pass rate
    const completedExecutions = executions.filter((e) => e.status === 'passed' || e.status === 'failed');
    const totalPassed = completedExecutions.reduce((sum, e) => sum + e.passedTests, 0);
    const totalRan = completedExecutions.reduce((sum, e) => sum + e.totalTests, 0);
    const overallPassRate = totalRan > 0 ? Math.round((totalPassed / totalRan) * 100 * 10) / 10 : 0;

    // Test status distribution
    const testsByStatus = {
      active: testCases.filter((tc) => tc.status === 'active').length,
      draft: testCases.filter((tc) => tc.status === 'draft').length,
      archived: testCases.filter((tc) => tc.status === 'archived').length,
    };

    // Recent executions
    const recentExecutions = executions.slice(0, 5);

    // Trend (last 7 days)
    const trend = this.generateTrend(executions);

    return {
      totalProjects,
      totalTests,
      totalExecutions,
      overallPassRate,
      recentExecutions,
      testsByStatus,
      executionTrend: trend,
    };
  }

  private generateTrend(executions: any[]): Array<{
    date: string;
    passed: number;
    failed: number;
    total: number;
  }> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map((date) => {
      const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      const dayExecs = executions.filter((e) => {
        const execDate = new Date(e.createdAt);
        return execDate.toDateString() === date.toDateString();
      });

      return {
        date: dateStr,
        passed: dayExecs.reduce((sum, e) => sum + e.passedTests, 0),
        failed: dayExecs.reduce((sum, e) => sum + e.failedTests, 0),
        total: dayExecs.reduce((sum, e) => sum + e.totalTests, 0),
      };
    });
  }
}
