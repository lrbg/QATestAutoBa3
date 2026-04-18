import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/tenant.decorator';
import { GitHubService } from './github.service';
import { IsString } from 'class-validator';

class ConnectGitHubDto {
  @IsString()
  projectId: string;

  @IsString()
  repoOwner: string;

  @IsString()
  repoName: string;
}

@ApiTags('github')
@Controller('github')
export class GitHubController {
  constructor(private githubService: GitHubService) {}

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  connect(@Body() dto: ConnectGitHubDto, @TenantId() tenantId: string) {
    return this.githubService.connectRepository(
      dto.projectId,
      tenantId,
      dto.repoOwner,
      dto.repoName,
    );
  }

  @Get('config/:projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getConfig(@Param('projectId') projectId: string) {
    return this.githubService.getConfig(projectId);
  }

  @Get('branches/:projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getBranches(@Param('projectId') projectId: string) {
    return this.githubService.getBranches(projectId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-github-event') event: string,
  ) {
    if (!tenantId) return { ok: false, message: 'Missing tenant ID' };
    await this.githubService.handleWebhook(payload, tenantId);
    return { ok: true };
  }
}
