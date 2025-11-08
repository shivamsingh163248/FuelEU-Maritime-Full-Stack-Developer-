// Debug Server - Step by Step Testing
import dotenv from 'dotenv';

console.log('🔍 Starting debug process...\n');

// Step 1: Load environment variables
console.log('📋 Step 1: Loading environment variables...');
dotenv.config();
console.log('✅ Environment variables loaded');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT}`);
console.log(`   DB_HOST: ${process.env.DB_HOST}`);
console.log(`   DB_PORT: ${process.env.DB_PORT}`);
console.log(`   DB_NAME: ${process.env.DB_NAME}`);
console.log(`   DB_USER: ${process.env.DB_USER}`);

// Step 2: Test PostgreSQL connection
console.log('\n🔌 Step 2: Testing PostgreSQL connection...');
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fueleu_maritime',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function testDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]}`);
    
    // Test tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`   Tables found: ${tablesResult.rows.length}`);
    tablesResult.rows.forEach(row => console.log(`     - ${row.table_name}`));
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Step 3: Test Express setup
console.log('\n🚀 Step 3: Testing Express setup...');
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
});

app.get('/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) as routes_count FROM routes');
    client.release();
    
    res.json({
      database: 'connected',
      routes_count: result.rows[0].routes_count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Database error',
      timestamp: new Date().toISOString()
    });
  }
});

// Main execution
async function main() {
  console.log('✅ Express app created');
  
  // Test database first
  const dbConnected = await testDatabase();
  
  if (dbConnected) {
    console.log('\n🌟 Step 4: Starting Express server...');
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Server started successfully!`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
      console.log(`🔗 DB test: http://localhost:${PORT}/db-test`);
      console.log(`\n🎉 Server is ready for testing!\n`);
    });

    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Trying port ${parseInt(PORT.toString()) + 1}...`);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.close(() => {
        console.log('✅ Server closed');
        pool.end().then(() => {
          console.log('✅ Database pool closed');
          process.exit(0);
        });
      });
    });
  } else {
    console.log('❌ Cannot start server - database connection failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
