import { Route, CreateRouteDto, VesselType, FuelType } from '../domain/route';

export interface RouteRepository {
  findAll(filters?: RouteFilters): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  create(route: CreateRouteDto): Promise<Route>;
  update(id: string, updates: Partial<Route>): Promise<Route>;
  setBaseline(id: string): Promise<Route>;
  delete(id: string): Promise<void>;
}

export interface RouteFilters {
  vesselType?: VesselType;
  fuelType?: FuelType;
  year?: number;
}
