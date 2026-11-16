import unzipper from 'unzipper';
import sax from 'sax';

const FILE_PATH = 'E:/Husnain/datamysql_convert/US Leads All.csv';

async function previewFirstRows() {
  const directory = await unzipper.Open.file(FILE_PATH);
  const ssFile = directory.files.find((f) => f.path === 'xl/sharedStrings.xml');
  const sheet1File = directory.files.find((f) => f.path === 'xl/worksheets/sheet1.xml');

  const sharedStrings: string[] = [];
  const saxSs = sax.createStream(true, { trim: false });
  let inText = false;
  let currentText = '';

  saxSs.on('opentag', (node) => {
    if (node.name === 't') {
      inText = true;
      currentText = '';
    }
  });
  saxSs.on('text', (t) => {
    if (inText) currentText += t;
  });
  saxSs.on('closetag', (tagName) => {
    if (tagName === 't') inText = false;
    else if (tagName === 'si') {
      sharedStrings.push(currentText);
      currentText = '';
    }
  });

  await new Promise<void>((resolve, reject) => {
    ssFile!.stream().pipe(saxSs).on('end', resolve).on('error', reject);
  });

  console.log(`Loaded ${sharedStrings.length} shared strings.`);

  const sheetStream = sheet1File!.stream();
  let buffer = '';
  let rowCount = 0;

  sheetStream.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    let rowEndIdx;
    while ((rowEndIdx = buffer.indexOf('</row>')) !== -1) {
      const rowXml = buffer.slice(0, rowEndIdx + 6);
      buffer = buffer.slice(rowEndIdx + 6);
      rowCount++;
      const rowData: Record<string, string> = {};
      const cellRegex = /<c r="([A-Z]+)\d+"(?:[^>]*?t="([^"]*)")?[^>]*?>.*?<v>(.*?)<\/v>/g;
      let cMatch;
      while ((cMatch = cellRegex.exec(rowXml)) !== null) {
        const col = cMatch[1];
        const isStr = cMatch[2] === 's';
        const val = cMatch[3];
        rowData[col] = isStr ? sharedStrings[parseInt(val, 10)] : val;
      }
      console.log(`Row ${rowCount}:`, rowData);
      if (rowCount >= 5) {
        sheetStream.destroy();
        process.exit(0);
      }
    }
  });
}

previewFirstRows().catch(console.error);

