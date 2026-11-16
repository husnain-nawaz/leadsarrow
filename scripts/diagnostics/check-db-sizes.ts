import mysql from 'mysql2/promise';

async function checkSizes() {
  const dbs = [
    { name: 'DB1', db: 'u340392193_leadsarrow', user: 'u340392193_leadsarrow' },
    { name: 'DB2', db: 'u340392193_leadsarrow2', user: 'u340392193_leadsarrow2' },
    { name: 'DB3', db: 'u340392193_leadsarrow3', user: 'u340392193_leadsarrow3' }
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
      const [rows]: any = await conn.query(`
        SELECT table_name, 
               round(data_length / 1024 / 1024, 2) as data_mb,
               round(index_length / 1024 / 1024, 2) as index_mb,
               round((data_length + index_length) / 1024 / 1024, 2) as total_mb
        FROM information_schema.TABLES 
        WHERE table_schema = ?`, [d.db]);
      console.log(`${d.name} (${d.db}):`, rows);
      await conn.end();
    } catch (e: any) {
      console.error(d.name, e.message);
    }
  }
}

checkSizes();

