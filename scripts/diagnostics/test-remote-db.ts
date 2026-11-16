import mysql from 'mysql2/promise';

async function testRemoteAuth() {
  console.log('Testing connection to Hostinger MySQL 193.203.184.241...');
  try {
    const conn = await mysql.createConnection({
      host: '193.203.184.241',
      port: 3306,
      user: 'u340392193_leadsarrow',
      password: 'Player74773/',
      database: 'u340392193_leadsarrow',
      connectTimeout: 10000
    });
    console.log('SUCCESS! Connected to Hostinger MySQL Database!');
    const [rows] = await conn.query('SHOW TABLES;');
    console.log('Hostinger Current Tables:', rows);
    await conn.end();
  } catch (err: any) {
    console.error('Connection failed:', err.message);
  }
  process.exit(0);
}

testRemoteAuth();
