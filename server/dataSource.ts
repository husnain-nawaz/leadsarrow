import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Lead } from './entities/Lead.ts';
import { User } from './entities/User.ts';
import { UserPurchase } from './entities/UserPurchase.ts';
import { UserLogin } from './entities/UserLogin.ts';
import { SavedList } from './entities/SavedList.ts';

dotenv.config();

// Primary Application & Auth Database (Database 4: u340392193_leadsarrow4 - Dedicated for Users, Profiles, Auth, Lists, Revealed Leads & New Ingestion)
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST_DB4 || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== '127.0.0.1' && process.env.MYSQL_HOST !== 'localhost' ? process.env.MYSQL_HOST : '193.203.184.241'),
  port: Number(process.env.MYSQL_PORT_DB4 || process.env.MYSQL_PORT || 3306),
  username: process.env.MYSQL_USER_MAIN || process.env.MYSQL_USER_DB4 || 'u340392193_leadsarrow4',
  password: process.env.MYSQL_PASSWORD_MAIN || process.env.MYSQL_PASSWORD_DB4 || 'Player74773/',
  database: process.env.MYSQL_DATABASE_MAIN || process.env.MYSQL_DATABASE_DB4 || 'u340392193_leadsarrow4',
  synchronize: false, // Schema already exists and indexed
  logging: false,
  entities: [User, UserPurchase, UserLogin, SavedList, Lead],
  extra: {
    connectionLimit: 15,
    waitForConnections: true,
    queueLimit: 0
  }
});

let isInitialized = false;

// Database 1 (u340392193_leadsarrow - 1.84M leads cluster node)
export const PrimaryDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST_DB1 || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== '127.0.0.1' && process.env.MYSQL_HOST !== 'localhost' ? process.env.MYSQL_HOST : '193.203.184.241'),
  port: Number(process.env.MYSQL_PORT_DB1 || process.env.MYSQL_PORT || 3306),
  username: process.env.MYSQL_USER_DB1 || 'u340392193_leadsarrow',
  password: process.env.MYSQL_PASSWORD_DB1 || 'Player74773/',
  database: process.env.MYSQL_DATABASE_DB1 || 'u340392193_leadsarrow',
  synchronize: false,
  logging: false,
  entities: [Lead],
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  }
});

let isDb1Initialized = false;

export async function getPrimaryDataSource(): Promise<DataSource | null> {
  if (!isDb1Initialized) {
    if (!PrimaryDataSource.isInitialized) {
      try {
        await PrimaryDataSource.initialize();
        console.log('Connected to Cluster Node DB1: u340392193_leadsarrow');
      } catch (e: any) {
        console.warn('Primary DB1 DataSource not available:', e.message);
        return null;
      }
    }
    isDb1Initialized = true;
  }
  return PrimaryDataSource;
}

// Database 2 (u340392193_leadsarrow2 - Sharded Leads Node)
export const SecondaryDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST_DB2 || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== '127.0.0.1' && process.env.MYSQL_HOST !== 'localhost' ? process.env.MYSQL_HOST : '193.203.184.241'),
  port: Number(process.env.MYSQL_PORT_DB2 || process.env.MYSQL_PORT || 3306),
  username: process.env.MYSQL_USER_DB2 || 'u340392193_leadsarrow2',
  password: process.env.MYSQL_PASSWORD_DB2 || 'Player74773/',
  database: process.env.MYSQL_DATABASE_DB2 || 'u340392193_leadsarrow2',
  synchronize: false,
  logging: false,
  entities: [Lead],
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  }
});

let isDb2Initialized = false;

export async function getSecondaryDataSource(): Promise<DataSource | null> {
  if (!isDb2Initialized) {
    if (!SecondaryDataSource.isInitialized) {
      try {
        await SecondaryDataSource.initialize();
        console.log('Connected to Sharded Secondary Database: u340392193_leadsarrow2');
      } catch (e: any) {
        console.warn('Secondary DataSource not available:', e.message);
        return null;
      }
    }
    isDb2Initialized = true;
  }
  return SecondaryDataSource;
}

// Tertiary Sharded Database (Hostinger Database 3 - Dedicated 4.15M Leads Node)
export const TertiaryDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST_DB3 || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== '127.0.0.1' && process.env.MYSQL_HOST !== 'localhost' ? process.env.MYSQL_HOST : '193.203.184.241'),
  port: Number(process.env.MYSQL_PORT_DB3 || process.env.MYSQL_PORT || 3306),
  username: process.env.MYSQL_USER_DB3 || 'u340392193_leadsarrow3',
  password: process.env.MYSQL_PASSWORD_DB3 || 'Player74773/',
  database: process.env.MYSQL_DATABASE_DB3 || 'u340392193_leadsarrow3',
  synchronize: false,
  logging: false,
  entities: [Lead],
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  }
});

let isDb3Initialized = false;

export async function getTertiaryDataSource(): Promise<DataSource | null> {
  if (!isDb3Initialized) {
    if (!TertiaryDataSource.isInitialized) {
      try {
        await TertiaryDataSource.initialize();
        console.log('Connected to Sharded Tertiary Database: u340392193_leadsarrow3');
      } catch (e: any) {
        console.warn('Tertiary DataSource not available:', e.message);
        return null;
      }
    }
    isDb3Initialized = true;
  }
  return TertiaryDataSource;
}

export async function getLeadsWriteDataSource(): Promise<DataSource> {
  // Database 4 (u340392193_leadsarrow4) is the designated active write cluster node!
  // Hostinger DB1, DB2, and DB3 are full (~3072 MB disk limit), so all new writes use DB4.
  const ds4 = await getDataSource();
  if (ds4 && ds4.isInitialized) return ds4;
  throw new Error('Database 4 write cluster node is not available.');
}

export async function getLeadsReadDataSource(): Promise<DataSource> {
  const ds3 = await getTertiaryDataSource();
  if (ds3 && ds3.isInitialized) return ds3;
  const ds2 = await getSecondaryDataSource();
  if (ds2 && ds2.isInitialized) return ds2;
  const ds1 = await getPrimaryDataSource();
  if (ds1 && ds1.isInitialized) return ds1;
  const ds4 = await getDataSource();
  if (ds4 && ds4.isInitialized) return ds4;
  throw new Error('No lead cluster node is available.');
}

export async function getLeadsDataSource(): Promise<DataSource> {
  return getLeadsWriteDataSource();
}

export const QuaternaryDataSource = AppDataSource;
export const getQuaternaryDataSource = getDataSource;

export async function getDataSource(): Promise<DataSource> {
  if (!isInitialized) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('TypeORM AppDataSource connected to MySQL database: ' + (process.env.MYSQL_DATABASE || 'B2B_database'));
      // Optimize session buffer sizes for high-speed multi-filter sorting and index scanning
      try {
        await AppDataSource.query('SET GLOBAL innodb_buffer_pool_size = 536870912');
      } catch (_) {}
      try {
        await AppDataSource.query('SET GLOBAL sort_buffer_size = 16777216');
        await AppDataSource.query('SET GLOBAL join_buffer_size = 16777216');
      } catch (_) {}
    }
    isInitialized = true;
  }
  return AppDataSource;
}

export async function initDatabaseSchema() {
  const ds = await getDataSource();
  console.log('TypeORM initialized schema connection.');
  return ds;
}

