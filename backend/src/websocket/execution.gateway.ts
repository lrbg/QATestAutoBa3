import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/executions',
})
export class ExecutionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ExecutionGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-execution')
  handleJoinExecution(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`execution-${data.executionId}`);
    this.logger.log(`Client ${client.id} joined execution room: ${data.executionId}`);
  }

  @SubscribeMessage('leave-execution')
  handleLeaveExecution(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`execution-${data.executionId}`);
  }

  // Called by ExecutionsService to broadcast updates
  emitExecutionUpdate(executionId: string, data: any) {
    this.server.to(`execution-${executionId}`).emit('execution-update', data);
  }

  emitTestResult(executionId: string, result: any) {
    this.server.to(`execution-${executionId}`).emit('test-result', result);
  }

  emitExecutionComplete(executionId: string, summary: any) {
    this.server.to(`execution-${executionId}`).emit('execution-complete', summary);
  }
}
