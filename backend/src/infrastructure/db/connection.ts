import { Pool } from 'pg';
import { Database } from './database';

const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fueleu_maritime',
  user: process.env.DB_USER || 'fueleu_user',
  password: process.env.DB_PASSWORD || 'fueleu_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

let database: Database | null = null;

export async function initializeDatabase(): Promise<Database | null> {
  try {
    console.log('🔌 Attempting to connect to PostgreSQL...');
    console.log(`📍 Connection details: ${databaseConfig.user}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`);
    
    database = new Database(databaseConfig);
    
    // Test the connection
    await database.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection successful!');
    
    // Initialize schema if needed
    await database.initializeSchema();
    console.log('📊 Database schema initialized');
    
    return database;
  } catch (error) {
    console.warn('⚠️ PostgreSQL connection failed:', (error as Error).message);
    console.log('🔄 Falling back to memory storage for demo purposes');
    return null;
  }
}

export function getDatabase(): Database | null {
  return database;
}

export async function testConnection(): Promise<boolean> {
  try {
    if (!database) {
      database = await initializeDatabase();
    }
    
    if (database) {
      await database.query('SELECT 1');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Database connection test failed:', (error as Error).message);
    return false;
  }
}
