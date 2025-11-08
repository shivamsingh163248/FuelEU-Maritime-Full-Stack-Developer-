// Simple database connection test script
import { config } from './config';

const { Pool } = require('pg');

async function testDatabaseConnection() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl,
  });

  try {
    console.log('🔄 Testing database connection...');
    console.log(`📍 Connecting to: ${config.database.host}:${config.database.port}/${config.database.name}`);
    
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    console.log('🔄 Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`⏰ Database time: ${result.rows[0].current_time}`);
    
    // Check tables
    console.log('🔄 Checking database tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No tables found in database');
    } else {
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    }
    
    // Test routes table specifically
    try {
      const routesCount = await client.query('SELECT COUNT(*) as count FROM routes');
      console.log(`🚢 Routes table: ${routesCount.rows[0].count} records`);
    } catch (error) {
      console.log('⚠️  Routes table not accessible:', error.message);
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Database connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure PostgreSQL container is running: docker ps');
    } else if (error.code === '3D000') {
      console.error('💡 Database does not exist. Check database name in .env');
    } else if (error.code === '28P01') {
      console.error('💡 Authentication failed. Check username/password in .env');
    }
    
    await pool.end();
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
