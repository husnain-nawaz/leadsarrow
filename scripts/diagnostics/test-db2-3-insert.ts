import mysql from 'mysql2/promise';

async function check() {
  const dbs = [
    { name: 'DB2', user: 'u340392193_leadsarrow2', db: 'u340392193_leadsarrow2' },
    { name: 'DB3', user: 'u340392193_leadsarrow3', db: 'u340392193_leadsarrow3' },
  ];

  for (const d of dbs) {
    try {
      const conn = await mysql.createConnection({
        host: '193.203.184.241',
        port: 3306,
        user: d.user,
        password: 'Player74773/',
        database: d.db
      });
      const testId = 'test_' + Date.now();
      await conn.query(`
        CREATE TABLE IF NOT EXISTS test_table (
          id VARCHAR(64) PRIMARY KEY,
          val VARCHAR(64)
        )
      `);
      await conn.query('INSERT INTO test_table (id, val) VALUES (?, ?)', [testId, 'ok']);
      console.log(`SUCCESS on ${d.name}: INSERT works!`);
      await conn.query('DROP TABLE test_table');
      await conn.end();
    } catch (err: any) {
      console.error(`ERROR on ${d.name}:`, err.message);
    }
  }
}

check();

