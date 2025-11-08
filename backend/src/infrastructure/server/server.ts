import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createRouteRouter } from '../../adapters/inbound/http/routes';
import { RouteController } from '../../adapters/inbound/http/route-controller';
import { RouteService } from '../../core/application/route-service';
import { MemoryRouteRepository } from '../../adapters/outbound/memory/memory-route-repository';
import { PostgresRouteRepository } from '../../adapters/outbound/postgres/postgres-route-repository';
import { initializeDatabase, getDatabase } from '../db/connection';


export class Server {
  private app: express.Application;
  private port: number;

  constructor(port: number = 3001) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
  }

  async initialize(): Promise<void> {
    await this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan('combined'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private async setupRoutes(): Promise<void> {
    // Try to initialize PostgreSQL database
    await initializeDatabase();
    const database = getDatabase();
    
    // Choose repository based on database availability
    const routeRepository = database 
      ? new PostgresRouteRepository(database)
      : new MemoryRouteRepository();
    
    console.log(`📦 Using ${database ? 'PostgreSQL' : 'Memory'} repository for routes`);
    
    // Services
    const routeService = new RouteService(routeRepository);

    // Controllers
    const routeController = new RouteController(routeService);

    // Routes
    this.app.use('/api/routes', createRouteRouter(routeController));

    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`Server running on port ${this.port}`);
        resolve();
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}
