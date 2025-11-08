// Minimal Working Server
// Basic Express server to test database connectivity

import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

console.log('🚀 Starting FuelEU Maritime API Server...\n');

// Configuration
const PORT = process.env.PORT || 3000;

console.log('📋 Configuration:');
console.log(`   PORT: ${PORT}`);
console.log(`   DB_HOST: ${process.env.DB_HOST}`);
console.log(`   DB_PORT: ${process.env.DB_PORT}`);
console.log(`   DB_NAME: ${process.env.DB_NAME}`);

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fueleu_maritime',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('\n🔌 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, version() as version');
    console.log('✅ Database connected successfully!');
    console.log(`   Time: ${result.rows[0].time}`);
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Express app
const app = express();

// Basic middleware
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'FuelEU Maritime API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Database status
app.get('/api/v1/database', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get tables and row counts
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const tables = [];
    
    for (const table of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        tables.push({
          name: table.table_name,
          rows: parseInt(countResult.rows[0].count)
        });
      } catch (err) {
        tables.push({
          name: table.table_name,
          rows: 0,
          error: 'Count failed'
        });
      }
    }
    
    client.release();
    
    res.json({
      success: true,
      database: 'connected',
      tables_count: tables.length,
      tables: tables,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Database error'
    });
  }
});

// Routes API (basic)
app.get('/api/v1/routes', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM routes ORDER BY created_at DESC LIMIT 10');
    client.release();
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch routes'
    });
  }
});

// Ship compliance API (basic)
app.get('/api/v1/compliance', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM ship_compliance ORDER BY last_calculated DESC LIMIT 10');
    client.release();
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch compliance data'
    });
  }
});

// Banking API (basic)
app.get('/api/v1/banking', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM bank_entries ORDER BY transaction_date DESC LIMIT 10');
    client.release();
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch banking data'
    });
  }
});

// Pools API (basic)
app.get('/api/v1/pools', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM pools ORDER BY created_at DESC LIMIT 10');
    client.release();
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pools data'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api/v1/database',
      'GET /api/v1/routes',
      'GET /api/v1/compliance',
      'GET /api/v1/banking',
      'GET /api/v1/pools'
    ]
  });
});

// Start server
async function startServer() {
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.error('💥 Cannot start server without database connection');
    process.exit(1);
  }
  
  const server = app.listen(PORT, () => {
    console.log(`\n🎉 Server started successfully!`);
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`📊 Database: http://localhost:${PORT}/api/v1/database`);
    console.log(`🚢 Routes: http://localhost:${PORT}/api/v1/routes`);
    console.log(`📋 Compliance: http://localhost:${PORT}/api/v1/compliance`);
    console.log(`🏦 Banking: http://localhost:${PORT}/api/v1/banking`);
    console.log(`🤝 Pools: http://localhost:${PORT}/api/v1/pools`);
    console.log('\n✅ All systems ready!\n');
  });
  
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use!`);
      console.log('💡 Try killing existing processes or use a different port');
    } else {
      console.error('❌ Server error:', error);
    }
    process.exit(1);
  });
  
  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('\n🛑 Graceful shutdown initiated...');
    server.close(() => {
      console.log('✅ HTTP server closed');
      pool.end().then(() => {
        console.log('✅ Database pool closed');
        console.log('👋 Goodbye!');
        process.exit(0);
      });
    });
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startServer().catch(error => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
