import { Request, Response } from 'express';
import { RouteService } from '../../../core/application/route-service';
import { VesselType, FuelType } from '../../../core/domain/route';
import { FuelEUError } from '../../../shared/constants';

export class RouteController {
  constructor(private routeService: RouteService) {}

  async getAllRoutes(req: Request, res: Response): Promise<void> {
    try {
      const { vesselType, fuelType, year } = req.query;
      
      const filters = {
        ...(vesselType && { vesselType: vesselType as VesselType }),
        ...(fuelType && { fuelType: fuelType as FuelType }),
        ...(year && { year: parseInt(year as string) }),
      };

      const routes = await this.routeService.getAllRoutes(filters);
      res.json(routes);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getRouteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const route = await this.routeService.getRouteById(id);
      res.json(route);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setBaseline(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const route = await this.routeService.setBaseline(id);
      res.json(route);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getComparison(_req: Request, res: Response): Promise<void> {
    try {
      const comparisons = await this.routeService.getComparison();
      res.json(comparisons);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any): void {
    if (error instanceof FuelEUError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}
