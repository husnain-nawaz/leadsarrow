import mysql from 'mysql2/promise';

async function testFacetTime() {
  const conn = await mysql.createConnection({
    host: '193.203.184.241',
    port: 3306,
    user: 'u340392193_leadsarrow2',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow2'
  });
  console.time('4 GROUP BY queries');
  await Promise.all([
    conn.query('SELECT industry as val, COUNT(*) as cnt FROM leads WHERE industry IS NOT NULL GROUP BY industry LIMIT 35'),
    conn.query('SELECT employee_range as val, COUNT(*) as cnt FROM leads WHERE employee_range IS NOT NULL GROUP BY employee_range LIMIT 20'),
    conn.query('SELECT revenue_range as val, COUNT(*) as cnt FROM leads WHERE revenue_range IS NOT NULL GROUP BY revenue_range LIMIT 20'),
    conn.query('SELECT country as val, COUNT(*) as cnt FROM leads WHERE country IS NOT NULL GROUP BY country LIMIT 20')
  ]);
  console.timeEnd('4 GROUP BY queries');
  await conn.end();
}

testFacetTime().catch(console.error);

