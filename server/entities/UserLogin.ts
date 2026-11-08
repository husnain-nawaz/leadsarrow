import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('user_logins')
@Index('idx_login_user', ['userId'])
export class UserLogin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  device: string | null;
}

