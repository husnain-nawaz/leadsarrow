import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('leads')
@Index('idx_domain', ['domain'])
@Index('idx_email', ['contactEmail'])
@Index('idx_industry', ['industry'])
@Index('idx_country', ['country'])
@Index('idx_score', ['buyingIntentScore'])
@Index('idx_custom', ['isCustom'])
@Index('idx_recent', ['isRecent'])
@Index('idx_seniority', ['seniority'])
@Index('idx_rev_range', ['revenueRange'])
@Index('idx_ind_score', ['industry', 'buyingIntentScore'])
@Index('idx_ind_sen_score', ['industry', 'seniority', 'buyingIntentScore'])
@Index('idx_company_name', ['companyName'])
@Index('idx_emp_count', ['employeeCount'])
@Index('idx_ann_rev', ['annualRevenueUsd'])
@Index('idx_emp_range', ['employeeRange'])
@Index('idx_department', ['department'])
@Index('idx_ver_status', ['verificationStatus'])
@Index('idx_direct_phone', ['hasDirectPhone'])
export class Lead {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  companyName: string;

  @Column({ type: 'varchar', length: 255 })
  domain: string;

  @Column({ type: 'varchar', length: 128 })
  industry: string;

  @Column({ name: 'employee_range', type: 'varchar', length: 64, default: '51-200' })
  employeeRange: string;

  @Column({ name: 'employee_count', type: 'int', default: 100 })
  employeeCount: number;

  @Column({ name: 'revenue_range', type: 'varchar', length: 64, default: '$10M - $50M' })
  revenueRange: string;

  @Column({ name: 'annual_revenue_usd', type: 'bigint', default: 25000000 })
  annualRevenueUsd: number;

  @Column({ type: 'varchar', length: 128, default: 'United States' })
  country: string;

  @Column({ type: 'varchar', length: 128, default: 'San Francisco, CA' })
  city: string;

  @Column({ name: 'contact_name', type: 'varchar', length: 255 })
  contactName: string;

  @Column({ name: 'contact_title', type: 'varchar', length: 255 })
  contactTitle: string;

  @Column({ type: 'varchar', length: 64, default: 'Director' })
  seniority: string;

  @Column({ type: 'varchar', length: 128, default: 'Sales & Revenue' })
  department: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 255 })
  contactEmail: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 64, nullable: true })
  contactPhone: string;

  @Column({ name: 'linkedin_url', type: 'varchar', length: 255, nullable: true })
  linkedinUrl: string;

  @Column({ name: 'verification_status', type: 'varchar', length: 32, default: 'Verified' })
  verificationStatus: string;

  @Column({ name: 'funding_stage', type: 'varchar', length: 64, default: 'Series B' })
  fundingStage: string;

  @Column({ name: 'tech_stack', type: 'json', nullable: true })
  techStack: any;

  @Column({ name: 'buying_intent_score', type: 'int', default: 85 })
  buyingIntentScore: number;

  @Column({ name: 'founded_year', type: 'int', default: 2018 })
  foundedYear: number;

  @Column({ name: 'has_direct_phone', type: 'tinyint', default: 1 })
  hasDirectPhone: number;

  @Column({ name: 'is_custom', type: 'tinyint', default: 0 })
  isCustom: number;

  @Column({ name: 'is_recent', type: 'tinyint', default: 1 })
  isRecent: number;

  @Column({ type: 'varchar', length: 64, default: 'mysql_b2b_database' })
  source: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

