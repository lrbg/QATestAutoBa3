import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/tenant.decorator';
import { ExecutionsService, CreateExecutionDto } from './executions.service';

@ApiTags('executions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('executions')
export class ExecutionsController {
  constructor(private executionsService: ExecutionsService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query('projectId') projectId?: string) {
    return this.executionsService.findAll(tenantId, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.executionsService.findOne(id, tenantId);
  }

  @Post()
  create(@Body() dto: CreateExecutionDto, @TenantId() tenantId: string) {
    return this.executionsService.create(dto, tenantId, 'manual');
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.executionsService.cancel(id, tenantId);
  }
}
