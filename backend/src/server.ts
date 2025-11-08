// Express Server Setup for FuelEU Maritime API
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { RouteController } from './adapters/controllers/RouteController';
import { RouteService } from './core/application/RouteService';
import { PostgreSQLRouteRepository } from './adapters/persistence/PostgreSQLRouteRepository';
import { DatabaseConnection } from './adapters/persistence/DatabaseConnection';
import { config } from './shared/config';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}));
app.use(morgan(config.logging.format));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl,
  maxConnections: config.database.maxConnections,
  idleTimeout: config.database.idleTimeout,
};

let dbConnection: DatabaseConnection;
let pool: Pool;

// Initialize database and repositories
async function initializeDatabase() {
  try {
    dbConnection = DatabaseConnection.getInstance(dbConfig);
    pool = dbConnection.getPool();
    
    // Test connection
    const isConnected = await dbConnection.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize services and controllers
function initializeServices() {
  const routeRepository = new PostgreSQLRouteRepository(pool);
  const routeService = new RouteService(routeRepository);
  const routeController = new RouteController(routeService);
  
  return { routeController };
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    if (pool) {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Info endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'FuelEU Maritime Compliance API',
    version: '1.0.0',
    description: 'API for managing FuelEU Maritime compliance, banking, and pooling',
    endpoints: {
      routes: '/api/v1/routes',
      compliance: '/api/v1/compliance',
      banking: '/api/v1/banking',
      pools: '/api/v1/pools'
    },
    documentation: 'https://github.com/fueleu-maritime/api-docs',
    timestamp: new Date().toISOString()
  });
});

// Routes setup
function setupRoutes(controllers: any) {
  const router = express.Router();
  
  // Route endpoints
  router.get('/routes', (req, res) => controllers.routeController.getAllRoutes(req, res));
  router.get('/routes/:id', (req, res) => controllers.routeController.getRouteById(req, res));
  router.post('/routes', (req, res) => controllers.routeController.createRoute(req, res));
  router.put('/routes/:id', (req, res) => controllers.routeController.updateRoute(req, res));
  router.delete('/routes/:id', (req, res) => controllers.routeController.deleteRoute(req, res));
  router.get('/routes/ship/:shipId', (req, res) => controllers.routeController.getRoutesByShip(req, res));
  router.get('/routes/ship/:shipId/report/:year', (req, res) => controllers.routeController.getRouteReport(req, res));
  router.post('/routes/:id/validate', (req, res) => controllers.routeController.validateRouteCompliance(req, res));
  router.get('/routes/:id/carbon-balance', (req, res) => controllers.routeController.getRouteCarbonBalance(req, res));
  
  // Placeholder endpoints for other services (to be implemented)
  router.get('/compliance', (req, res) => {
    res.json({
      message: 'Compliance endpoints - Coming soon',
      available: [
        'GET /api/v1/compliance',
        'GET /api/v1/compliance/:id',
        'POST /api/v1/compliance',
        'GET /api/v1/compliance/ship/:shipId',
        'GET /api/v1/compliance/report/:year'
      ]
    });
  });
  
  router.get('/banking', (req, res) => {
    res.json({
      message: 'Banking endpoints - Coming soon',
      available: [
        'GET /api/v1/banking',
        'GET /api/v1/banking/:id',
        'POST /api/v1/banking/deposit',
        'POST /api/v1/banking/withdraw',
        'POST /api/v1/banking/transfer',
        'GET /api/v1/banking/ship/:shipId/balance'
      ]
    });
  });
  
  router.get('/pools', (req, res) => {
    res.json({
      message: 'Pool endpoints - Coming soon',
      available: [
        'GET /api/v1/pools',
        'GET /api/v1/pools/:id',
        'POST /api/v1/pools',
        'POST /api/v1/pools/:id/join',
        'DELETE /api/v1/pools/:id/leave',
        'GET /api/v1/pools/:id/members'
      ]
    });
  });
  
  app.use('/api/v1', router);
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'GET /api/v1',
      'GET /api/v1/routes'
    ]
  });
});

// Start server
async function startServer() {
  console.log('🚀 Starting FuelEU Maritime API Server...');
  
  // Initialize database
  const dbConnected = await initializeDatabase();
  if (!dbConnected) {
    console.error('💥 Failed to start server - database connection failed');
    process.exit(1);
  }
  
  // Initialize services
  const controllers = initializeServices();
  console.log('✅ Services initialized');
  
  // Setup routes
  setupRoutes(controllers);
  console.log('✅ Routes configured');
  
  // Start listening
  app.listen(PORT, () => {
    console.log(`🎉 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Info: http://localhost:${PORT}/api/v1`);
    console.log(`🚢 Routes API: http://localhost:${PORT}/api/v1/routes`);
    console.log(`🗄️ Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  if (dbConnection) {
    await dbConnection.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  if (dbConnection) {
    await dbConnection.close();
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  });
}

export default app;
