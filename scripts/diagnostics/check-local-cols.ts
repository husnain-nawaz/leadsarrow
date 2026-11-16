import mysql from 'mysql2/promise';

async function checkLocalCols() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Player74773/',
    database: 'B2B_database'
  });
  const [cols]: any = await conn.query('DESCRIBE leads');
  console.log('Local leads table columns:', cols.map((c: any) => c.Field));
  await conn.end();
}

checkLocalCols();

