import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('github_configs')
export class GitHubConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', unique: true })
  @Index()
  projectId: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'repo_owner' })
  repoOwner: string;

  @Column({ name: 'repo_name' })
  repoName: string;

  @Column({ name: 'default_branch', default: 'main' })
  defaultBranch: string;

  @Column({ name: 'webhook_id', nullable: true })
  webhookId: number;

  @Column({ default: false })
  connected: boolean;

  @Column({ name: 'last_sync_at', nullable: true })
  lastSyncAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
