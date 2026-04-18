import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  baseUrl?: string;

  @IsString()
  @IsOptional()
  githubRepo?: string;

  @IsString()
  @IsOptional()
  githubBranch?: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async findAll(tenantId: string): Promise<Project[]> {
    return this.projectsRepository.find({
      where: { tenantId, status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id, tenantId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(dto: CreateProjectDto, tenantId: string): Promise<Project> {
    const project = this.projectsRepository.create({
      ...dto,
      tenantId,
    });
    return this.projectsRepository.save(project);
  }

  async update(id: string, dto: Partial<CreateProjectDto>, tenantId: string): Promise<Project> {
    const project = await this.findOne(id, tenantId);
    Object.assign(project, dto);
    return this.projectsRepository.save(project);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const project = await this.findOne(id, tenantId);
    project.status = 'archived';
    await this.projectsRepository.save(project);
  }

  async incrementTestCount(id: string, delta: number): Promise<void> {
    await this.projectsRepository.increment({ id }, 'testCount', delta);
  }

  async updatePassRate(id: string, passRate: number): Promise<void> {
    await this.projectsRepository.update(id, {
      passRate,
      lastRunAt: new Date(),
    });
  }
}
