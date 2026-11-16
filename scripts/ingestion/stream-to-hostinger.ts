import mysql from 'mysql2/promise';

async function streamRemainingLeads() {
  console.log('Connecting to Local MySQL (Source) and Hostinger MySQL (Target)...');

  const localPool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Player74773/',
    database: 'B2B_database',
    waitForConnections: true,
    connectionLimit: 10
  });

  const hostingerPool = mysql.createPool({
    host: '193.203.184.241',
    port: 3306,
    user: 'u340392193_leadsarrow',
    password: 'Player74773/',
    database: 'u340392193_leadsarrow',
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });

  try {
    const [localCountRes]: any = await localPool.query('SELECT COUNT(*) as total FROM leads');
    const totalLocal = localCountRes[0].total;

    const [remoteCountRes]: any = await hostingerPool.query('SELECT COUNT(*) as total FROM leads');
    let currentRemote = remoteCountRes[0].total;

    console.log(`\n=== RESUMING STREAM PIPELINE ===`);
    console.log(`Local MySQL total leads: ${totalLocal.toLocaleString()}`);
    console.log(`Hostinger MySQL leads currently: ${currentRemote.toLocaleString()}`);
    console.log(`Remaining leads to transfer: ${(totalLocal - currentRemote).toLocaleString()}`);
    console.log(`================================\n`);

    const BATCH_SIZE = 1000;
    let offset = currentRemote;
    const startTime = Date.now();

    while (offset < totalLocal) {
      let rows: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const [r]: any = await localPool.query(
            `SELECT 
              id, company_name, domain, industry, employee_range, employee_count,
              revenue_range, annual_revenue_usd, country, city, contact_name,
              contact_title, seniority, department, contact_email, contact_phone,
              linkedin_url, verification_status, funding_stage, tech_stack,
              buying_intent_score, founded_year, has_direct_phone, is_custom,
              is_recent, source, created_at
             FROM leads 
             LIMIT ? OFFSET ?`,
            [BATCH_SIZE, offset]
          );
          rows = r;
          break;
        } catch (e: any) {
          console.warn(`Local read retry ${attempt}/3:`, e.message);
          await new Promise(res => setTimeout(res, 2000));
        }
      }

      if (!rows || rows.length === 0) {
        break;
      }

      const values = rows.map((r: any) => {
        let techStr = '[]';
        if (Array.isArray(r.tech_stack)) {
          techStr = JSON.stringify(r.tech_stack);
        } else if (typeof r.tech_stack === 'string' && r.tech_stack.trim()) {
          techStr = r.tech_stack;
        }

        return [
          r.id,
          r.company_name ? String(r.company_name).slice(0, 255) : null,
          r.domain ? String(r.domain).slice(0, 255) : null,
          r.industry ? String(r.industry).slice(0, 255) : null,
          r.employee_range ? String(r.employee_range).slice(0, 100) : null,
          r.employee_count || null,
          r.revenue_range ? String(r.revenue_range).slice(0, 100) : null,
          r.annual_revenue_usd || null,
          r.country ? String(r.country).slice(0, 100) : null,
          r.city ? String(r.city).slice(0, 255) : null,
          r.contact_name ? String(r.contact_name).slice(0, 255) : null,
          r.contact_title ? String(r.contact_title).slice(0, 255) : null,
          r.seniority ? String(r.seniority).slice(0, 100) : null,
          r.department ? String(r.department).slice(0, 100) : null,
          r.contact_email ? String(r.contact_email).slice(0, 255) : null,
          r.contact_phone ? String(r.contact_phone).slice(0, 100) : null,
          r.linkedin_url ? String(r.linkedin_url).slice(0, 500) : null,
          r.verification_status ? String(r.verification_status).slice(0, 50) : 'Verified',
          r.funding_stage ? String(r.funding_stage).slice(0, 100) : null,
          techStr,
          r.buying_intent_score || 85,
          r.founded_year || null,
          r.has_direct_phone ? 1 : 0,
          r.is_custom ? 1 : 0,
          r.is_recent ? 1 : 0,
          r.source ? String(r.source).slice(0, 100) : 'Import',
          r.created_at || new Date()
        ];
      });

      const sql = `INSERT IGNORE INTO leads 
        (id, company_name, domain, industry, employee_range, employee_count,
         revenue_range, annual_revenue_usd, country, city, contact_name,
         contact_title, seniority, department, contact_email, contact_phone,
         linkedin_url, verification_status, funding_stage, tech_stack,
         buying_intent_score, founded_year, has_direct_phone, is_custom,
         is_recent, source, created_at) 
        VALUES ?`;

      let inserted = false;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await hostingerPool.query(sql, [values]);
          inserted = true;
          break;
        } catch (e: any) {
          console.warn(`\nRemote insert retry ${attempt}/5: ${e.message}`);
          await new Promise(res => setTimeout(res, 3000));
        }
      }

      if (!inserted) {
        throw new Error(`Failed to insert batch at offset ${offset} after 5 retries.`);
      }

      offset += rows.length;

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = Math.round((offset - currentRemote) / Math.max(1, (Date.now() - startTime) / 1000));
      
      process.stdout.write(`\rTransferred & Committed to Hostinger: ${offset.toLocaleString()} / ${totalLocal.toLocaleString()} | Rate: ${rate}/s | Elapsed: ${elapsedSec}s`);
    }

    const [finalCountRes]: any = await hostingerPool.query('SELECT COUNT(*) as total FROM leads');
    console.log(`\n\nTransfer Fully Finished!`);
    console.log(`Total Leads in Hostinger Database: ${finalCountRes[0].total.toLocaleString()}`);

  } catch (err: any) {
    console.error('\nPipeline Error:', err.message);
  } finally {
    await localPool.end();
    await hostingerPool.end();
  }
}

streamRemainingLeads();
