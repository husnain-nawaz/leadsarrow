import mysql from 'mysql2/promise';

async function fixDb2Table() {
  const conn2 = await mysql.createConnection({
    host: '193.203.184.241',
    port: 3306,
    user: 'u340392193_leadsarrow2',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow2'
  });
  await conn2.query('DROP TABLE IF EXISTS saved_lists');
  await conn2.query(`
    CREATE TABLE saved_lists (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      lead_ids LONGTEXT NULL,
      filter_summary TEXT NULL,
      lead_count INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_saved_lists_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Recreated saved_lists on DB2 directly with DB2 user!');
  const testId = 'test_' + Date.now();
  await conn2.query('INSERT INTO saved_lists (id, user_id, name, description, lead_ids, filter_summary, lead_count) VALUES (?, ?, ?, ?, ?, ?, ?)', [
    testId, 'test_user', 'My List', 'note', JSON.stringify(['id1']), 'summary', 1
  ]);
  console.log('SUCCESS on DB2: Insert works now!');
  await conn2.query('DELETE FROM saved_lists WHERE id = ?', [testId]);
  await conn2.end();
}

fixDb2Table().catch(console.error);

