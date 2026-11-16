import mysql from 'mysql2/promise';

async function testInsertNow() {
  const conn = await mysql.createConnection({
    host: '193.203.184.241',
    user: 'u340392193_leadsarrow',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow'
  });

  try {
    await conn.query("INSERT INTO leads (id, company_name) VALUES ('test_probe_id', 'Test Probe')");
    console.log('INSERT SUCCESSFUL!');
    await conn.query("DELETE FROM leads WHERE id = 'test_probe_id'");
  } catch (e: any) {
    console.error('Insert probe error:', e.message);
  } finally {
    await conn.end();
  }
}

testInsertNow();

