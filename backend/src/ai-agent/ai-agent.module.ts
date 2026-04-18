import { Module } from '@nestjs/common';
import { AIAgentController } from './ai-agent.controller';
import { AIAgentService } from './ai-agent.service';
import { MCPClientService } from './mcp-client.service';
import { TestCasesModule } from '../test-cases/test-cases.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TestCasesModule, AuthModule],
  controllers: [AIAgentController],
  providers: [AIAgentService, MCPClientService],
  exports: [AIAgentService],
})
export class AIAgentModule {}
