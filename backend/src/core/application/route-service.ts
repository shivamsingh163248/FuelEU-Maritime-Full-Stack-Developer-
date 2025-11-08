import { Route, RouteComparison } from '../domain/route';
import { RouteRepository, RouteFilters } from '../ports/route-repository';
import { FUEL_EU_CONSTANTS, FuelEUError, ERROR_CODES } from '../../shared/constants';
import { calculatePercentageDifference } from '../../shared/utils';

export class RouteService {
  constructor(private routeRepository: RouteRepository) {}

  async getAllRoutes(filters?: RouteFilters): Promise<Route[]> {
    return this.routeRepository.findAll(filters);
  }

  async getRouteById(id: string): Promise<Route> {
    const route = await this.routeRepository.findById(id);
    if (!route) {
      throw new FuelEUError('Route not found', ERROR_CODES.ROUTE_NOT_FOUND, 404);
    }
    return route;
  }

  async setBaseline(routeId: string): Promise<Route> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new FuelEUError('Route not found', ERROR_CODES.ROUTE_NOT_FOUND, 404);
    }
    
    return this.routeRepository.setBaseline(routeId);
  }

  async getComparison(): Promise<RouteComparison[]> {
    const baseline = await this.routeRepository.findBaseline();
    if (!baseline) {
      throw new FuelEUError('No baseline route set', ERROR_CODES.BASELINE_NOT_SET, 400);
    }

    const allRoutes = await this.routeRepository.findAll();
    const comparisonRoutes = allRoutes.filter(route => route.id !== baseline.id);
    
    const targetIntensity = FUEL_EU_CONSTANTS.TARGET_INTENSITY[2025]; // Using 2025 target

    return comparisonRoutes.map(comparisonRoute => {
      const percentDiff = calculatePercentageDifference(
        comparisonRoute.ghgIntensity, 
        baseline.ghgIntensity
      );
      
      const compliant = comparisonRoute.ghgIntensity <= targetIntensity;

      return {
        baseline,
        comparison: comparisonRoute,
        percentDiff,
        compliant,
        targetIntensity,
      };
    });
  }
}
