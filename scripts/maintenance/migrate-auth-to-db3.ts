import mysql from 'mysql2/promise';

async function migrateUserTablesToDb3() {
  const conn2 = await mysql.createConnection({
    host: '193.203.184.241',
    user: 'u340392193_leadsarrow2',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow2'
  });

  const conn3 = await mysql.createConnection({
    host: '193.203.184.241',
    user: 'u340392193_leadsarrow3',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow3'
  });

  console.log('Connected to both DB2 and DB3.');

  // 1. Create tables in DB3 if not exist
  const [createTable] = await conn2.query<any>('SHOW CREATE TABLE users');
  const [createPurchases] = await conn2.query<any>('SHOW CREATE TABLE user_purchases');
  const [createLogins] = await conn2.query<any>('SHOW CREATE TABLE user_logins');

  await conn3.query(createTable[0]['Create Table']);
  console.log('users table created in DB3');

  await conn3.query(createPurchases[0]['Create Table']);
  console.log('user_purchases table created in DB3');

  await conn3.query(createLogins[0]['Create Table']);
  console.log('user_logins table created in DB3');

  // 2. Copy all users
  const [users] = await conn2.query<any>('SELECT * FROM users');
  for (const u of users) {
    const keys = Object.keys(u);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => u[k]);
    const sql = `INSERT IGNORE INTO users (${keys.join(', ')}) VALUES (${placeholders})`;
    await conn3.query(sql, values);
  }
  console.log(`Copied ${users.length} users to DB3.`);

  // 3. Copy purchases
  const [purchases] = await conn2.query<any>('SELECT * FROM user_purchases');
  for (const p of purchases) {
    const keys = Object.keys(p);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => p[k]);
    const sql = `INSERT IGNORE INTO user_purchases (${keys.join(', ')}) VALUES (${placeholders})`;
    await conn3.query(sql, values);
  }
  console.log(`Copied ${purchases.length} user_purchases to DB3.`);

  // 4. Copy logins
  const [logins] = await conn2.query<any>('SELECT * FROM user_logins');
  for (const l of logins) {
    const keys = Object.keys(l);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => l[k]);
    const sql = `INSERT IGNORE INTO user_logins (${keys.join(', ')}) VALUES (${placeholders})`;
    await conn3.query(sql, values);
  }
  console.log(`Copied ${logins.length} user_logins to DB3.`);

  // 5. Test UPDATE on DB3
  await conn3.query("UPDATE users SET credits_remaining = credits_remaining - 1 WHERE id = 'usr_1794512698255'");
  const [testUser] = await conn3.query<any>("SELECT id, name, credits_remaining FROM users WHERE id = 'usr_1794512698255'");
  console.log('Test update verified on DB3! User now:', testUser[0]);

  await conn2.end();
  await conn3.end();
}

migrateUserTablesToDb3().catch(console.error);

