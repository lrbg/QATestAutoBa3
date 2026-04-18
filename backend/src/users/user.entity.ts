import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'member' | 'viewer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ name: 'tenant_id', length: 100 })
  @Index()
  tenantId: string;

  @Column({ name: 'tenant_name', length: 255, nullable: true })
  tenantName: string;

  @Column({ type: 'enum', enum: ['admin', 'member', 'viewer'], default: 'admin' })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
