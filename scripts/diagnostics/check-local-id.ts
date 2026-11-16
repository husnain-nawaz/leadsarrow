import mysql from 'mysql2/promise';

async function checkLocal() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Player74773/',
    database: 'B2B_database'
  });
  const [sample]: any = await conn.query('SELECT id, company_name FROM leads LIMIT 3');
  console.log('Sample rows:', sample);
  await conn.end();
}

checkLocal().catch(console.error);
