import mysql from 'mysql2/promise';

async function initDb3() {
  console.log('Connecting to Hostinger DB3: u340392193_leadsarrow3...');
  const conn = await mysql.createConnection({
    host: '193.203.184.241',
    user: 'u340392193_leadsarrow3',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow3'
  });

  console.log('Creating lightweight leads table in Database 3...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id VARCHAR(255) PRIMARY KEY,
      company_name VARCHAR(255),
      domain VARCHAR(255),
      industry VARCHAR(255),
      employee_range VARCHAR(100),
      employee_count INT,
      revenue_range VARCHAR(100),
      annual_revenue_usd BIGINT,
      country VARCHAR(100),
      city VARCHAR(255),
      contact_name VARCHAR(255),
      contact_title VARCHAR(255),
      seniority VARCHAR(100),
      department VARCHAR(100),
      contact_email VARCHAR(255),
      contact_phone VARCHAR(100),
      linkedin_url VARCHAR(500),
      verification_status VARCHAR(50),
      funding_stage VARCHAR(100),
      tech_stack LONGTEXT,
      buying_intent_score INT,
      founded_year INT,
      has_direct_phone TINYINT(1) DEFAULT 0,
      is_custom TINYINT(1) DEFAULT 0,
      is_recent TINYINT(1) DEFAULT 0,
      source VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_comp (company_name),
      INDEX idx_ind (industry)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Testing insert on Database 3...');
  await conn.query("INSERT INTO leads (id, company_name) VALUES ('probe_db3', 'Probe DB3')");
  console.log('Probe inserted successfully!');
  await conn.query("DELETE FROM leads WHERE id = 'probe_db3'");

  console.log('🎉 Database 3 (u340392193_leadsarrow3) is 100% READY for streaming!');
  await conn.end();
}

initDb3().catch(console.error);

