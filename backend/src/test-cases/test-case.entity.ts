import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type TestPriority = 'low' | 'medium' | 'high' | 'critical';
export type TestStatus = 'draft' | 'active' | 'archived';
export type TestResult = 'passed' | 'failed' | 'skipped' | 'error';

export interface TestStep {
  id: string;
  order: number;
  action: string;
  selector?: string;
  value?: string;
  expectedResult?: string;
}

@Entity('test_cases')
export class TestCase {
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

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: '[]' })
  steps: TestStep[];

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'enum', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  priority: TestPriority;

  @Column({ type: 'enum', enum: ['draft', 'active', 'archived'], default: 'draft' })
  status: TestStatus;

  @Column({ name: 'last_result', type: 'enum', enum: ['passed', 'failed', 'skipped', 'error'], nullable: true })
  lastResult: TestResult;

  @Column({ name: 'last_run_at', nullable: true })
  lastRunAt: Date;

  @Column({ name: 'generated_by_ai', default: false })
  generatedByAI: boolean;

  @Column({ name: 'playwright_code', type: 'text', nullable: true })
  playwrightCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
