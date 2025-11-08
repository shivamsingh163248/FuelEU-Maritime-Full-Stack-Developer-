// Route Controller - REST API endpoints for route management
import { Request, Response } from 'express';
import { RouteService } from '../../core/application/RouteService';
import { RouteData } from '../../core/domain/Route';

export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  // GET /api/v1/routes
  async getAllRoutes(req: Request, res: Response): Promise<void> {
    try {
      const routes = await this.routeService.getAllRoutes();
      res.json({
        success: true,
        data: routes.map(route => route.toData()),
        count: routes.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/v1/routes/:id
  async getRouteById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid route ID'
        });
        return;
      }

      const route = await this.routeService.getRouteById(id);
      res.json({
        success: true,
        data: route.toData()
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // POST /api/v1/routes
  async createRoute(req: Request, res: Response): Promise<void> {
    try {
      const routeData: RouteData = {
        ...req.body,
        departureDate: new Date(req.body.departureDate),
        arrivalDate: new Date(req.body.arrivalDate)
      };

      const route = await this.routeService.createRoute(routeData);
      res.status(201).json({
        success: true,
        data: route.toData(),
        message: 'Route created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Bad request'
      });
    }
  }

  // PUT /api/v1/routes/:id
  async updateRoute(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid route ID'
        });
        return;
      }

      const updateData: Partial<RouteData> = { ...req.body };
      if (req.body.departureDate) {
        updateData.departureDate = new Date(req.body.departureDate);
      }
      if (req.body.arrivalDate) {
        updateData.arrivalDate = new Date(req.body.arrivalDate);
      }

      const route = await this.routeService.updateRoute(id, updateData);
      res.json({
        success: true,
        data: route.toData(),
        message: 'Route updated successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Bad request'
      });
    }
  }

  // DELETE /api/v1/routes/:id
  async deleteRoute(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid route ID'
        });
        return;
      }

      await this.routeService.deleteRoute(id);
      res.json({
        success: true,
        message: 'Route deleted successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/v1/routes/ship/:shipId
  async getRoutesByShip(req: Request, res: Response): Promise<void> {
    try {
      const shipId = req.params.shipId;
      const routes = await this.routeService.getRoutesByShip(shipId);
      res.json({
        success: true,
        data: routes.map(route => route.toData()),
        count: routes.length,
        shipId
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Bad request'
      });
    }
  }

  // GET /api/v1/routes/ship/:shipId/report/:year
  async getRouteReport(req: Request, res: Response): Promise<void> {
    try {
      const shipId = req.params.shipId;
      const year = parseInt(req.params.year);
      
      if (isNaN(year)) {
        res.status(400).json({
          success: false,
          error: 'Invalid year'
        });
        return;
      }

      const report = await this.routeService.generateRouteReport(shipId, year);
      res.json({
        success: true,
        data: {
          ...report,
          routes: report.routes.map(route => route.toData())
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Bad request'
      });
    }
  }

  // POST /api/v1/routes/:id/validate
  async validateRouteCompliance(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid route ID'
        });
        return;
      }

      const validation = await this.routeService.validateRouteCompliance(id);
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/v1/routes/:id/carbon-balance
  async getRouteCarbonBalance(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid route ID'
        });
        return;
      }

      const carbonBalance = await this.routeService.calculateRouteCarbonBalance(id);
      res.json({
        success: true,
        data: {
          routeId: id,
          carbonBalance,
          unit: 'tCO2eq',
          isCompliant: carbonBalance <= 0
        }
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}
