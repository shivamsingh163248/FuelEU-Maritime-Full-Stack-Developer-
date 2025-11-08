// Database Connection Test
import { DatabaseConnection, getDatabaseConfig } from '../adapters/persistence/DatabaseConnection';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseConnection(): Promise<void> {
  console.log('🔧 Testing database connection...');
  
  try {
    // Get database configuration
    const config = getDatabaseConfig();
    console.log('📋 Database Configuration:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Max Connections: ${config.maxConnections}`);
    
    // Initialize database connection
    const dbConnection = DatabaseConnection.getInstance(config);
    
    // Test connection
    const isConnected = await dbConnection.testConnection();
    
    if (isConnected) {
      console.log('✅ Database connection successful!');
      
      // Test a simple query
      const pool = dbConnection.getPool();
      const client = await pool.connect();
      
      try {
        const result = await client.query('SELECT COUNT(*) as route_count FROM routes');
        console.log(`📊 Routes in database: ${result.rows[0].route_count}`);
        
        const complianceResult = await client.query('SELECT COUNT(*) as compliance_count FROM ship_compliance');
        console.log(`📊 Compliance records: ${complianceResult.rows[0].compliance_count}`);
        
        const poolResult = await client.query('SELECT COUNT(*) as pool_count FROM pools');
        console.log(`📊 Pools: ${poolResult.rows[0].pool_count}`);
        
        console.log('✅ Database schema validation successful!');
        
      } catch (queryError) {
        console.error('❌ Database query failed:', queryError);
      } finally {
        client.release();
      }
      
    } else {
      console.error('❌ Database connection failed!');
    }
    
    // Close connection
    await dbConnection.close();
    console.log('🔒 Database connection closed');
    
  } catch (error) {
    console.error('💥 Database connection error:', error);
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection();
}

export { testDatabaseConnection };
