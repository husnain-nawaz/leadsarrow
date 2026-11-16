import mysql from 'mysql2/promise';

async function check() {
  const conn = await mysql.createConnection({
    host: '193.203.184.241',
    port: 3306,
    user: 'u340392193_leadsarrow',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow'
  });
  try {
    const testId = 'test_' + Date.now();
    await conn.query('INSERT INTO users (id, email, password_hash, full_name, plan, role, daily_credits, remaining_credits) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      testId, 'test@example.com', 'dummyhash', 'Test User', 'free', 'user', 100, 100
    ]);
    console.log('SUCCESS: Inserted user from external IP!');
    await conn.query('DELETE FROM users WHERE id = ?', [testId]);
  } catch (err: any) {
    console.error('ERROR on DB1:', err.message);
  }
  await conn.end();
}

check();

