import mysql from 'mysql2/promise';

async function cleanupIndexes() {
  console.log('Connecting to Hostinger MySQL...');
  const conn = await mysql.createConnection({
    host: '193.203.184.241',
    user: 'u340392193_leadsarrow',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow'
  });

  const heavyIndexes = [
    'idx_cov_sen_score',
    'idx_cov_emp_rev',
    'idx_cov_leads',
    'idx_cov_dept',
    'idx_ind_emp_score',
    'idx_rev_emp_ind',
    'idx_ind_sen_score',
    'idx_ind_score',
    'idx_ind_fund',
    'wdbi_verification_status_24a99e054a9d',
    'wdbi_country_7151c62f4003',
    'wdbi_funding_stage_972257ef88c7',
    'idx_recent',
    'idx_custom'
  ];

  for (const idx of heavyIndexes) {
    try {
      console.log(`Dropping index ${idx}...`);
      await conn.query(`ALTER TABLE leads DROP INDEX ${idx};`);
      console.log(`✓ Dropped ${idx}`);
    } catch (err: any) {
      console.log(`Index ${idx} skip/not found:`, err.message);
    }
  }

  const [status]: any = await conn.query("SHOW TABLE STATUS LIKE 'leads'");
  console.log('\nNew Leads Table Status:', {
    Data_MB: ((status[0]?.Data_length || 0) / 1024 / 1024).toFixed(2),
    Index_MB: ((status[0]?.Index_length || 0) / 1024 / 1024).toFixed(2),
    Total_MB: (((status[0]?.Data_length || 0) + (status[0]?.Index_length || 0)) / 1024 / 1024).toFixed(2)
  });

  await conn.end();
}

cleanupIndexes();

