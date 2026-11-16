import mysql from 'mysql2/promise';

async function testFilterSpeed() {
  const conn = await mysql.createConnection({
    host: '193.203.184.241',
    port: 3306,
    user: 'u340392193_leadsarrow2',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow2'
  });

  console.time('Filtered top 25 records (industry)');
  const [rows] = await conn.query('SELECT id, company_name, domain, industry, employee_range, revenue_range, country, city, contact_name, contact_title, contact_email, contact_phone, buying_intent_score FROM leads WHERE industry = ? LIMIT 25', ['Manufacturing']);
  console.timeEnd('Filtered top 25 records (industry)');

  console.time('Filtered count(*) (industry)');
  const [c] = await conn.query('SELECT COUNT(id) FROM leads WHERE industry = ?', ['Manufacturing']);
  console.timeEnd('Filtered count(*) (industry)');

  await conn.end();
}

testFilterSpeed().catch(console.error);

