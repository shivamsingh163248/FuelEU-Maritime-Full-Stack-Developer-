import 'dotenv/config';
import { Server } from './infrastructure/server/server';
import { testConnection } from './infrastructure/db/connection';

async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting FuelEU Maritime API server...');
    
    // Test database connection
    const dbConnected = await testConnection();
    console.log(`📊 Database status: ${dbConnected ? 'Connected (PostgreSQL)' : 'Fallback (Memory)'}`);
    
    // Start server
    const port = parseInt(process.env.PORT || '3001');
    const server = new Server(port);
    await server.initialize();
    await server.start();

    console.log(`🚀 FuelEU Maritime API server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🛠️ API endpoints: http://localhost:${port}/api`);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
