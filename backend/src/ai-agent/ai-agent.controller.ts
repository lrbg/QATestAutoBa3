import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/tenant.decorator';
import { AIAgentService, GenerateTestsDto, ChatDto } from './ai-agent.service';
import { IsString, IsOptional, IsArray } from 'class-validator';

class ChatRequestDto {
  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsArray()
  @IsOptional()
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

class AnalyzeDto {
  @IsString()
  executionId: string;

  @IsArray()
  results: any[];
}

@ApiTags('ai-agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-agent')
export class AIAgentController {
  constructor(private aiAgentService: AIAgentService) {}

  @Post('generate-tests')
  generateTests(@Body() dto: GenerateTestsDto, @TenantId() tenantId: string) {
    return this.aiAgentService.generateTests(dto, tenantId);
  }

  @Post('chat')
  async chat(
    @Body() dto: ChatRequestDto,
    @TenantId() tenantId: string,
    @Res() res: Response,
  ) {
    return this.aiAgentService.streamChat(dto, res);
  }

  @Post('analyze')
  analyze(@Body() dto: AnalyzeDto, @TenantId() tenantId: string) {
    return this.aiAgentService.analyzeResults(dto.executionId, dto.results, tenantId);
  }
}
