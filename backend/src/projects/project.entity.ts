import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'tenant_id', length: 100 })
  @Index()
  tenantId: string;

  @Column({ name: 'github_repo', length: 255, nullable: true })
  githubRepo: string;

  @Column({ name: 'github_branch', length: 100, nullable: true, default: 'main' })
  githubBranch: string;

  @Column({ name: 'base_url', length: 500, nullable: true })
  baseUrl: string;

  @Column({ type: 'enum', enum: ['active', 'archived'], default: 'active' })
  status: 'active' | 'archived';

  @Column({ name: 'test_count', default: 0 })
  testCount: number;

  @Column({ name: 'pass_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  passRate: number;

  @Column({ name: 'last_run_at', nullable: true })
  lastRunAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
