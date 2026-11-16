import mysql from 'mysql2/promise';

async function checkRemoteCount() {
  const conn = await mysql.createConnection({
    host: 'srv1086.hstgr.io',
    user: 'u340392193_leadsarrow',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow'
  });
  const [r]: any = await conn.query('SELECT COUNT(*) as cnt FROM leads');
  console.log('Hostinger leads count now:', r[0].cnt);
  await conn.end();
}

checkRemoteCount();

