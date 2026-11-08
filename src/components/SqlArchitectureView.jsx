import React from 'react';
import { useSelector } from 'react-redux';
import { Database, ArrowLeft } from 'lucide-react';

const RELATIONAL_SCHEMA_DDL = `-- Relational B2B Lead & Firmographic Schema (MySQL / SQL Compatible)
CREATE TABLE b2b_companies (
  id VARCHAR(64) PRIMARY KEY,
  company_name VARCHAR(160) NOT NULL,
  domain VARCHAR(160) NOT NULL UNIQUE,
  industry VARCHAR(100) NOT NULL,
  employee_range VARCHAR(50) NOT NULL,
  employee_count INT NOT NULL,
  revenue_range VARCHAR(60) NOT NULL,
  annual_revenue_usd BIGINT NOT NULL,
  country VARCHAR(80) NOT NULL,
  city VARCHAR(80) NOT NULL,
  funding_stage VARCHAR(60) NOT NULL,
  founded_year SMALLINT,
  sic_code VARCHAR(16),
  naics_code VARCHAR(16),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_industry_country (industry, country),
  INDEX idx_revenue_employees (revenue_range, employee_range),
  FULLTEXT INDEX ft_company_domain (company_name, domain)
);

CREATE TABLE b2b_contacts (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  contact_title VARCHAR(120) NOT NULL,
  seniority VARCHAR(60) NOT NULL,
  department VARCHAR(80) NOT NULL,
  contact_email VARCHAR(160) NOT NULL,
  contact_phone VARCHAR(60),
  verification_status ENUM('Verified', 'Catch-All', 'Pending') DEFAULT 'Verified',
  buying_intent_score TINYINT UNSIGNED NOT NULL,
  FOREIGN KEY (company_id) REFERENCES b2b_companies(id) ON DELETE CASCADE,
  INDEX idx_seniority_dept (seniority, department),
  INDEX idx_intent_verified (buying_intent_score DESC, verification_status)
);`;

export default function SqlArchitectureView({ onBack }) {
  const { executedSql, pagination } = useSelector((state) => state.leads);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-600" />
            <span>Relational SQL Schema & Query Planner</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-million record B2B relational schema, composite B-Tree indexes, and live query representation
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Lead Finder
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Generated SQL Query from Active Redux Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 font-display">
              Active Filter SQL Query
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {(pagination.estimatedGlobalMatches || 0).toLocaleString()} matched rows
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Dynamically constructed from your active Redux sidebar filters and sort parameters:
          </p>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
            {executedSql || 'SELECT * FROM b2b_companies LIMIT 25;'}
          </pre>
        </div>

        {/* Relational DDL Schema */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 font-display">
              Indexed Relational DDL Schema
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Composite B-Tree + Full-Text
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Normalized company firmographics and decision-maker tables optimized for high-selectivity sidebar filtering:
          </p>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed max-h-80">
            {RELATIONAL_SCHEMA_DDL}
          </pre>
        </div>
      </div>
    </div>
  );
}
