import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ExecutionStatus = 'pending' | 'running' | 'passed' | 'failed' | 'cancelled';
export type ExecutionTrigger = 'manual' | 'github' | 'scheduled' | 'ai';

export interface StepResult {
  order: number;
  action: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  errorMessage?: string;
  screenshot?: string;
}

export interface TestResult {
  id: string;
  executionId: string;
  testCaseId: string;
  testCaseName: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration?: number;
  errorMessage?: string;
  screenshot?: string;
  logs: string[];
  steps: StepResult[];
}

@Entity('executions')
export class Execution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', length: 100 })
  @Index()
  projectId: string;

  @Column({ name: 'tenant_id', length: 100 })
  @Index()
  tenantId: string;

  @Column({ length: 500 })
  name: string;

  @Column({ type: 'enum', enum: ['pending', 'running', 'passed', 'failed', 'cancelled'], default: 'pending' })
  status: ExecutionStatus;

  @Column({ name: 'triggered_by', type: 'enum', enum: ['manual', 'github', 'scheduled', 'ai'], default: 'manual' })
  triggeredBy: ExecutionTrigger;

  @Column({ nullable: true, length: 200 })
  branch: string;

  @Column({ name: 'commit_sha', nullable: true, length: 40 })
  commitSha: string;

  @Column({ name: 'total_tests', default: 0 })
  totalTests: number;

  @Column({ name: 'passed_tests', default: 0 })
  passedTests: number;

  @Column({ name: 'failed_tests', default: 0 })
  failedTests: number;

  @Column({ name: 'skipped_tests', default: 0 })
  skippedTests: number;

  @Column({ nullable: true, type: 'bigint' })
  duration: number;

  @Column({ name: 'test_case_ids', type: 'simple-array', nullable: true })
  testCaseIds: string[];

  @Column({ type: 'jsonb', default: '[]' })
  results: TestResult[];

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
