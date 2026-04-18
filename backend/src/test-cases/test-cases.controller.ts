import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/tenant.decorator';
import { TestCasesService, CreateTestCaseDto } from './test-cases.service';

@ApiTags('test-cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('test-cases')
export class TestCasesController {
  constructor(private testCasesService: TestCasesService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query('projectId') projectId?: string) {
    return this.testCasesService.findAll(tenantId, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.testCasesService.findOne(id, tenantId);
  }

  @Post()
  create(@Body() dto: CreateTestCaseDto, @TenantId() tenantId: string) {
    return this.testCasesService.create(dto, tenantId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTestCaseDto>,
    @TenantId() tenantId: string,
  ) {
    return this.testCasesService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.testCasesService.remove(id, tenantId);
  }
}
