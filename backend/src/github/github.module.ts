import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { GitHubConfig } from './github-config.entity';
import { ExecutionsModule } from '../executions/executions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GitHubConfig]), ExecutionsModule, AuthModule],
  controllers: [GitHubController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
