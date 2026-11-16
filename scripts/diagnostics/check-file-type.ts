import unzipper from 'unzipper';
import fs from 'fs';

const FILE_PATH = 'E:/Husnain/datamysql_convert/US Leads All.csv';

async function checkFileType() {
  const fd = fs.openSync(FILE_PATH, 'r');
  const buffer = Buffer.alloc(4);
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  console.log('Is ZIP/XLSX?:', isZip, buffer);

  if (isZip) {
    const directory = await unzipper.Open.file(FILE_PATH);
    console.log('Files inside:', directory.files.map(f => f.path));
  } else {
    // Read first 5 lines of plain CSV
    const text = fs.readFileSync(FILE_PATH, { encoding: 'utf8', flag: 'r' }).slice(0, 1000);
    console.log('Plain CSV preview:\n', text);
  }
}

checkFileType().catch(console.error);

