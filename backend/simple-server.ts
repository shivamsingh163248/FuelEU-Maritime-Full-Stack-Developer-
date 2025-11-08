// Simple API Test Server
// Minimal server to test database connection and basic endpoints

import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fueleu_maritime',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

console.log('🔧 Database Config:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'fueleu_maritime',
  user: process.env.DB_USER || 'postgres'
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    console.log('🏥 Health check requested...');
    
    // Test database connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as db_time, version() as db_version');
    client.release();
    
    console.log('✅ Database connected successfully');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      db_time: result.rows[0].db_time,
      db_version: result.rows[0].db_version.split(' ')[0],
      api_version: '1.0.0'
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Test database tables
app.get('/api/v1/database/status', async (req, res) => {
  try {
    console.log('📊 Database status requested...');
    
    const client = await pool.connect();
    
    // Get all tables with row counts
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log(`📋 Found ${tablesResult.rows.length} tables`);
    
    const tableStats = [];
    for (const table of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        tableStats.push({
          table_name: table.table_name,
          row_count: parseInt(countResult.rows[0].count)
        });
        console.log(`   📊 ${table.table_name}: ${countResult.rows[0].count} rows`);
      } catch (error) {
        console.error(`   ❌ Error counting ${table.table_name}:`, error);
        tableStats.push({
          table_name: table.table_name,
          row_count: 0,
          error: 'Count failed'
        });
      }
    }
    
    client.release();
    
    res.json({
      success: true,
      database: 'connected',
      total_tables: tableStats.length,
      tables: tableStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database status failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Database query failed'
    });
  }
});

// Simple routes endpoint
app.get('/api/v1/routes', async (req, res) => {
  try {
    console.log('🚢 Routes requested...');
    
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM routes ORDER BY created_at DESC LIMIT 5');
    client.release();
    
    console.log(`✅ Found ${result.rows.length} routes`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: 'Routes retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Routes query failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch routes'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FuelEU Maritime API Server',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'GET /api/v1/database/status - Database status',
      'GET /api/v1/routes - Get routes'
    ],
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 FuelEU Maritime API Server started!`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 Database Status: http://localhost:${PORT}/api/v1/database/status`);
  console.log(`🚢 Routes API: http://localhost:${PORT}/api/v1/routes`);
  console.log(`\n⏳ Ready to accept requests...\n`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app };
