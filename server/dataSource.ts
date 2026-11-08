import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Lead } from './entities/Lead.ts';
import { User } from './entities/User.ts';
import { UserPurchase } from './entities/UserPurchase.ts';
import { UserLogin } from './entities/UserLogin.ts';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'B2B_database',
  synchronize: false, // Schema already exists and indexed
  logging: false,
  entities: [Lead, User, UserPurchase, UserLogin],
  extra: {
    connectionLimit: 15,
    waitForConnections: true,
    queueLimit: 0
  }
});

let isInitialized = false;

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

