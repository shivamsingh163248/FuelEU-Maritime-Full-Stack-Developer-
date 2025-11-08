// Simple Database Connection Test
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fueleu_maritime',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    console.log('🔌 Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`⏰ Database time: ${result.rows[0].current_time}`);
    
    // Test tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('\n📋 Available tables:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    // Test sample data
    const routesCountQuery = 'SELECT COUNT(*) as count FROM routes';
    const routesCount = await client.query(routesCountQuery);
    console.log(`\n🚢 Routes in database: ${routesCount.rows[0].count}`);
    
    client.release();
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();
