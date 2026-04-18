import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProjectsModule } from '../projects/projects.module';
import { TestCasesModule } from '../test-cases/test-cases.module';
import { ExecutionsModule } from '../executions/executions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProjectsModule, TestCasesModule, ExecutionsModule, AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
