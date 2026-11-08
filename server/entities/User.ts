import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 64, default: 'Revenue Operations' })
  role: string;

  @Column({ name: 'is_super_admin', type: 'tinyint', default: 0 })
  isSuperAdmin: number;

  @Column({ name: 'is_deactivated', type: 'tinyint', default: 0 })
  isDeactivated: number;

  @Column({ type: 'varchar', length: 255, default: 'Growth Workspace' })
  company: string;

  @Column({ type: 'varchar', length: 64, default: 'Free Starter' })
  plan: string;

  @Column({ name: 'plan_id', type: 'varchar', length: 32, default: 'free' })
  planId: string;

  @Column({ name: 'credits_remaining', type: 'int', default: 100 })
  creditsRemaining: number;

  @Column({ name: 'daily_credits_limit', type: 'int', default: 100 })
  dailyCreditsLimit: number;

  @Column({ name: 'credits_used_today', type: 'int', default: 0 })
  creditsUsedToday: number;

  @Column({ name: 'total_credits_used', type: 'int', default: 0 })
  totalCreditsUsed: number;

  @Column({ name: 'payment_status', type: 'varchar', length: 32, default: 'free' })
  paymentStatus: string;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  amountPaid: number;

  @Column({ name: 'total_paid', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  totalPaid: number;

  @Column({ name: 'auth_provider', type: 'varchar', length: 32, default: 'jwt' })
  authProvider: string;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string | null;

  @Column({ name: 'last_login_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

