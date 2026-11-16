import mysql from 'mysql2/promise';

async function checkCols() {
  const conn = await mysql.createConnection({
    host: 'srv1086.hstgr.io',
    user: 'u340392193_leadsarrow',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow'
  });
  const [cols]: any = await conn.query('DESCRIBE leads');
  console.log('Hostinger leads table columns:', cols.map((c: any) => c.Field));
  await conn.end();
}

checkCols();

