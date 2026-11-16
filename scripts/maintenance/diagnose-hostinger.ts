import mysql from 'mysql2/promise';

async function diagnoseHostinger() {
  const remote = await mysql.createConnection({
    host: '193.203.184.241',
    user: 'u340392193_leadsarrow',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow'
  });

  try {
    const [grants]: any = await remote.query('SHOW GRANTS FOR CURRENT_USER()');
    console.log('User Grants:', grants);

    const [tableStatus]: any = await remote.query("SHOW TABLE STATUS LIKE 'leads'");
    console.log('Leads Table Status:', {
      Rows: tableStatus[0]?.Rows,
      Data_length_MB: ((tableStatus[0]?.Data_length || 0) / 1024 / 1024).toFixed(2),
      Index_length_MB: ((tableStatus[0]?.Index_length || 0) / 1024 / 1024).toFixed(2),
      Total_size_MB: (((tableStatus[0]?.Data_length || 0) + (tableStatus[0]?.Index_length || 0)) / 1024 / 1024).toFixed(2)
    });

    const [dbSize]: any = await remote.query(`
      SELECT table_schema "database_name",
             ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) "size_mb"
      FROM information_schema.TABLES
      WHERE table_schema = "u340392193_leadsarrow"
      GROUP BY table_schema;
    `);
    console.log('Database Total Size:', dbSize);

  } catch (err: any) {
    console.error('Diagnosis Error:', err.message);
  } finally {
    await remote.end();
  }
}

diagnoseHostinger();

