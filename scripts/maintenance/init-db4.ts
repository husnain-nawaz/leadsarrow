import mysql from 'mysql2/promise';

async function initDb4() {
  const conn3 = await mysql.createConnection({
    host: '193.203.184.241',
    user: 'u340392193_leadsarrow3',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow3'
  });

  const conn4 = await mysql.createConnection({
    host: '193.203.184.241',
    user: 'u340392193_leadsarrow4',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow4'
  });

  console.log('Connected to DB3 and DB4.');

  // Create users table
  await conn4.query(`
    CREATE TABLE IF NOT EXISTS users (
      id varchar(64) NOT NULL,
      name varchar(255) NOT NULL,
      email varchar(255) NOT NULL,
      password_hash varchar(255) DEFAULT NULL,
      role varchar(32) NOT NULL DEFAULT 'Revenue Operations',
      is_super_admin tinyint(1) NOT NULL DEFAULT 0,
      is_deactivated tinyint(1) NOT NULL DEFAULT 0,
      company varchar(255) NOT NULL DEFAULT 'Growth Workspace',
      plan varchar(64) NOT NULL DEFAULT 'Free Starter',
      plan_id varchar(32) NOT NULL DEFAULT 'free',
      credits_remaining int(11) NOT NULL DEFAULT 100,
      daily_credits_limit int(11) NOT NULL DEFAULT 100,
      credits_used_today int(11) NOT NULL DEFAULT 0,
      total_credits_used int(11) NOT NULL DEFAULT 0,
      payment_status varchar(32) NOT NULL DEFAULT 'free',
      amount_paid decimal(10,2) NOT NULL DEFAULT 0.00,
      total_paid decimal(10,2) NOT NULL DEFAULT 0.00,
      auth_provider varchar(32) NOT NULL DEFAULT 'jwt',
      photo_url longtext DEFAULT NULL,
      last_login_at datetime DEFAULT CURRENT_TIMESTAMP,
      created_at datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('users table created in DB4');

  // Create user_purchases table
  await conn4.query(`
    CREATE TABLE IF NOT EXISTS user_purchases (
      id varchar(64) NOT NULL,
      user_id varchar(64) NOT NULL,
      invoice_number varchar(64) NOT NULL,
      plan_name varchar(64) NOT NULL,
      plan_id varchar(32) NOT NULL,
      credits_granted varchar(32) NOT NULL,
      amount decimal(10,2) NOT NULL DEFAULT 0.00,
      currency varchar(8) NOT NULL DEFAULT 'USD',
      status varchar(32) NOT NULL DEFAULT 'Completed',
      payment_method varchar(64) NOT NULL DEFAULT 'Card',
      date datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_user_purchases_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('user_purchases table created in DB4');

  // Create user_logins table
  await conn4.query(`
    CREATE TABLE IF NOT EXISTS user_logins (
      id varchar(64) NOT NULL,
      user_id varchar(64) NOT NULL,
      ip varchar(64) DEFAULT NULL,
      location varchar(128) DEFAULT NULL,
      device varchar(128) DEFAULT NULL,
      timestamp datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_user_logins_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('user_logins table created in DB4');

  // Create saved_lists table
  await conn4.query(`
    CREATE TABLE IF NOT EXISTS saved_lists (
      id varchar(64) NOT NULL,
      user_id varchar(64) DEFAULT NULL,
      name varchar(255) NOT NULL,
      description text DEFAULT NULL,
      lead_ids json DEFAULT NULL,
      filter_summary varchar(500) DEFAULT NULL,
      lead_count int(11) DEFAULT 0,
      created_at datetime DEFAULT CURRENT_TIMESTAMP,
      updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_saved_lists_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('saved_lists table created in DB4');

  // Create user_revealed_leads table
  await conn4.query(`
    CREATE TABLE IF NOT EXISTS user_revealed_leads (
      user_id varchar(64) NOT NULL,
      lead_id varchar(128) NOT NULL,
      revealed_at datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, lead_id),
      KEY idx_revealed_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('user_revealed_leads table created in DB4');

  // Copy existing records from DB3 to DB4
  for (const tbl of ['users', 'user_purchases', 'user_logins', 'saved_lists', 'user_revealed_leads']) {
    try {
      const [rows] = await conn3.query<any>(`SELECT * FROM ${tbl}`);
      if (rows && rows.length > 0) {
        for (const row of rows) {
          const keys = Object.keys(row);
          const placeholders = keys.map(() => '?').join(', ');
          const values = keys.map((k) => typeof row[k] === 'object' && row[k] !== null && !(row[k] instanceof Date) ? JSON.stringify(row[k]) : row[k]);
          await conn4.query(`INSERT IGNORE INTO ${tbl} (${keys.join(', ')}) VALUES (${placeholders})`, values);
        }
        console.log(`Migrated ${rows.length} rows for table ${tbl} to DB4.`);
      }
    } catch (e: any) {
      console.warn(`Note on ${tbl}:`, e.message);
    }
  }

  await conn3.end();
  await conn4.end();
  console.log('Database 4 initialization & schema sync complete!');
}

initDb4().catch(console.error);

