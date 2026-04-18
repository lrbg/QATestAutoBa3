import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestCase, TestPriority, TestStatus, TestStep } from './test-case.entity';
import { IsString, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';

export class CreateTestCaseDto {
  @IsString()
  projectId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  steps?: TestStep[];

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: TestPriority;

  @IsEnum(['draft', 'active', 'archived'])
  @IsOptional()
  status?: TestStatus;

  @IsString()
  @IsOptional()
  playwrightCode?: string;

  @IsBoolean()
  @IsOptional()
  generatedByAI?: boolean;
}

@Injectable()
export class TestCasesService {
  constructor(
    @InjectRepository(TestCase)
    private testCasesRepository: Repository<TestCase>,
  ) {}

  async findAll(tenantId: string, projectId?: string): Promise<TestCase[]> {
    const query = this.testCasesRepository
      .createQueryBuilder('tc')
      .where('tc.tenantId = :tenantId', { tenantId })
      .andWhere('tc.status != :archived', { archived: 'archived' });

    if (projectId) {
      query.andWhere('tc.projectId = :projectId', { projectId });
    }

    return query.orderBy('tc.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, tenantId: string): Promise<TestCase> {
    const tc = await this.testCasesRepository.findOne({
      where: { id, tenantId },
    });
    if (!tc) throw new NotFoundException('Test case not found');
    return tc;
  }

  async findByProject(projectId: string, tenantId: string): Promise<TestCase[]> {
    return this.testCasesRepository.find({
      where: { projectId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateTestCaseDto, tenantId: string): Promise<TestCase> {
    const tc = this.testCasesRepository.create({
      ...dto,
      tenantId,
      steps: dto.steps || [],
      tags: dto.tags || [],
    });
    return this.testCasesRepository.save(tc);
  }

  async update(id: string, dto: Partial<CreateTestCaseDto>, tenantId: string): Promise<TestCase> {
    const tc = await this.findOne(id, tenantId);
    Object.assign(tc, dto);
    return this.testCasesRepository.save(tc);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const tc = await this.findOne(id, tenantId);
    tc.status = 'archived';
    await this.testCasesRepository.save(tc);
  }

  async updateResult(id: string, result: TestCase['lastResult']): Promise<void> {
    await this.testCasesRepository.update(id, {
      lastResult: result,
      lastRunAt: new Date(),
    });
  }
}
