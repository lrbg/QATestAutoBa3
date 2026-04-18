import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution, ExecutionTrigger } from './execution.entity';
import { TestCasesService } from '../test-cases/test-cases.service';
import { ProjectsService } from '../projects/projects.service';
import { PlaywrightRunner } from './playwright.runner';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateExecutionDto {
  @IsString()
  projectId: string;

  @IsArray()
  @IsOptional()
  testCaseIds?: string[];

  @IsString()
  @IsOptional()
  branch?: string;
}

@Injectable()
export class ExecutionsService {
  private readonly logger = new Logger(ExecutionsService.name);

  constructor(
    @InjectRepository(Execution)
    private executionsRepository: Repository<Execution>,
    private testCasesService: TestCasesService,
    private projectsService: ProjectsService,
    private playwrightRunner: PlaywrightRunner,
  ) {}

  async findAll(tenantId: string, projectId?: string): Promise<Execution[]> {
    const query = this.executionsRepository
      .createQueryBuilder('exec')
      .where('exec.tenantId = :tenantId', { tenantId });

    if (projectId) {
      query.andWhere('exec.projectId = :projectId', { projectId });
    }

    return query.orderBy('exec.createdAt', 'DESC').limit(50).getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Execution> {
    const exec = await this.executionsRepository.findOne({ where: { id, tenantId } });
    if (!exec) throw new NotFoundException('Execution not found');
    return exec;
  }

  async create(
    dto: CreateExecutionDto,
    tenantId: string,
    triggeredBy: ExecutionTrigger = 'manual',
  ): Promise<Execution> {
    const project = await this.projectsService.findOne(dto.projectId, tenantId);

    let testCases = await this.testCasesService.findByProject(dto.projectId, tenantId);
    if (dto.testCaseIds && dto.testCaseIds.length > 0) {
      testCases = testCases.filter((tc) => dto.testCaseIds!.includes(tc.id));
    }

    const execution = this.executionsRepository.create({
      projectId: dto.projectId,
      tenantId,
      name: `${project.name} - ${new Date().toLocaleString()}`,
      status: 'pending',
      triggeredBy,
      branch: dto.branch || project.githubBranch || 'main',
      totalTests: testCases.length,
      testCaseIds: testCases.map((tc) => tc.id),
      results: [],
    });

    const saved = await this.executionsRepository.save(execution);

    // Run asynchronously
    this.runExecution(saved.id, testCases, project.baseUrl || '', tenantId).catch((err) => {
      this.logger.error(`Execution ${saved.id} failed: ${err.message}`);
    });

    return saved;
  }

  private async runExecution(
    executionId: string,
    testCases: any[],
    baseUrl: string,
    tenantId: string,
  ): Promise<void> {
    const execution = await this.executionsRepository.findOne({ where: { id: executionId } });
    if (!execution) return;

    execution.status = 'running';
    execution.startedAt = new Date();
    await this.executionsRepository.save(execution);

    try {
      const results = await this.playwrightRunner.runTests(testCases, baseUrl, executionId);

      const passed = results.filter((r) => r.status === 'passed').length;
      const failed = results.filter((r) => r.status === 'failed' || r.status === 'error').length;
      const skipped = results.filter((r) => r.status === 'skipped').length;

      const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
      const passRate = results.length > 0 ? (passed / results.length) * 100 : 0;

      execution.status = failed > 0 ? 'failed' : 'passed';
      execution.passedTests = passed;
      execution.failedTests = failed;
      execution.skippedTests = skipped;
      execution.duration = totalDuration;
      execution.completedAt = new Date();
      execution.results = results;

      await this.executionsRepository.save(execution);

      // Update project pass rate
      await this.projectsService.updatePassRate(execution.projectId, passRate);

      // Update test case results
      for (const result of results) {
        await this.testCasesService.updateResult(result.testCaseId, result.status as any);
      }
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      await this.executionsRepository.save(execution);
    }
  }

  async cancel(id: string, tenantId: string): Promise<Execution> {
    const execution = await this.findOne(id, tenantId);
    execution.status = 'cancelled';
    execution.completedAt = new Date();
    return this.executionsRepository.save(execution);
  }
}
