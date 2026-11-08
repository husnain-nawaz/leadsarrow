import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('user_purchases')
@Index('idx_user_id', ['userId'])
export class UserPurchase {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 64 })
  invoiceNumber: string;

  @CreateDateColumn({ name: 'date' })
  date: Date;

  @Column({ name: 'plan_name', type: 'varchar', length: 128 })
  planName: string;

  @Column({ name: 'plan_id', type: 'varchar', length: 32 })
  planId: string;

  @Column({ name: 'credits_granted', type: 'varchar', length: 64 })
  creditsGranted: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 32, default: 'Completed' })
  status: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 128 })
  paymentMethod: string;
}

