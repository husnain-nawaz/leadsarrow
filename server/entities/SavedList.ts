import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

@Entity({ name: 'saved_lists' })
export class SavedList {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 64, nullable: true })
  userId?: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'lead_ids', type: 'json', nullable: true })
  leadIds?: string[] | null;

  @Column({ name: 'filter_summary', type: 'text', nullable: true })
  filterSummary?: string | null;

  @Column({ name: 'lead_count', type: 'int', default: 0 })
  leadCount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}

