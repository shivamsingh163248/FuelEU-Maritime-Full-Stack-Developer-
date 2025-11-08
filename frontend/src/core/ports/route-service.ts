import type { Route, RouteComparison, RouteFilters } from '../domain/route';

export interface RouteService {
  getAllRoutes(filters?: RouteFilters): Promise<Route[]>;
  getRouteById(id: string): Promise<Route>;
  setBaseline(id: string): Promise<Route>;
  getComparison(): Promise<RouteComparison[]>;
}
