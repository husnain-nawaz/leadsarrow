import mysql from 'mysql2/promise';

async function testSingleInsertFixed() {
  const local = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Player74773/',
    database: 'B2B_database'
  });

  const remote = await mysql.createConnection({
    host: 'srv1086.hstgr.io',
    user: 'u340392193_leadsarrow',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow'
  });

  const [rows]: any = await local.query('SELECT * FROM leads LIMIT 1');
  const r = rows[0];

  try {
    const techStackJson = Array.isArray(r.tech_stack) ? JSON.stringify(r.tech_stack) : (r.tech_stack || '[]');
    const res: any = await remote.query(
      `INSERT INTO leads 
       (id, company_name, domain, industry, employee_range, employee_count,
        revenue_range, annual_revenue_usd, country, city, contact_name,
        contact_title, seniority, department, contact_email, contact_phone,
        linkedin_url, verification_status, funding_stage, tech_stack,
        buying_intent_score, founded_year, has_direct_phone, is_custom,
        is_recent, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id, r.company_name, r.domain, r.industry, r.employee_range, r.employee_count,
        r.revenue_range, r.annual_revenue_usd, r.country, r.city, r.contact_name,
        r.contact_title, r.seniority, r.department, r.contact_email, r.contact_phone,
        r.linkedin_url, r.verification_status, r.funding_stage, techStackJson,
        r.buying_intent_score, r.founded_year, r.has_direct_phone ? 1 : 0, r.is_custom ? 1 : 0,
        r.is_recent ? 1 : 0, r.source, r.created_at || new Date()
      ]
    );
    console.log('INSERT SUCCESS:', res[0].affectedRows);
  } catch (err: any) {
    console.error('Insert error:', err.message);
  }

  const [cnt]: any = await remote.query('SELECT COUNT(*) as c FROM leads');
  console.log('Count in Hostinger now:', cnt[0].c);

  await local.end();
  await remote.end();
}

testSingleInsertFixed();
