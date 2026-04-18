import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/tenant.decorator';
import { ProjectsService, CreateProjectDto } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.projectsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.projectsService.findOne(id, tenantId);
  }

  @Post()
  create(@Body() dto: CreateProjectDto, @TenantId() tenantId: string) {
    return this.projectsService.create(dto, tenantId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProjectDto>,
    @TenantId() tenantId: string,
  ) {
    return this.projectsService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.projectsService.remove(id, tenantId);
  }
}
