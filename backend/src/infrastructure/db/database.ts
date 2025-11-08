import { Pool, PoolConfig } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export class Database {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool(config);
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async executeScript(filePath: string): Promise<void> {
    const sql = fs.readFileSync(filePath, 'utf8');
    await this.query(sql);
  }

  async initializeSchema(): Promise<void> {
    const schemaPath = path.join(__dirname, 'schema.sql');
    await this.executeScript(schemaPath);
  }

  async seedData(): Promise<void> {
    const seedPath = path.join(__dirname, 'seed.sql');
    await this.executeScript(seedPath);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }
}

let database: Database;

export const getDatabase = (): Database => {
  if (!database) {
    const config: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fueleu_maritime',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
    database = new Database(config);
  }
  return database;
};
