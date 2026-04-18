import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Execution } from './execution.entity';
import { ExecutionsController } from './executions.controller';
import { ExecutionsService } from './executions.service';
import { PlaywrightRunner } from './playwright.runner';
import { TestCasesModule } from '../test-cases/test-cases.module';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Execution]),
    TestCasesModule,
    ProjectsModule,
    AuthModule,
  ],
  controllers: [ExecutionsController],
  providers: [ExecutionsService, PlaywrightRunner],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
