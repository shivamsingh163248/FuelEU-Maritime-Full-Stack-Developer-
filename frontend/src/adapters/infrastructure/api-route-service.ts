import axios from 'axios';
import type { Route, RouteComparison, RouteFilters } from '../../core/domain/route';
import type { RouteService } from '../../core/ports/route-service';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export class ApiRouteService implements RouteService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async getAllRoutes(filters?: RouteFilters): Promise<Route[]> {
    const params = new URLSearchParams();
    if (filters?.vesselType) params.append('vesselType', filters.vesselType);
    if (filters?.fuelType) params.append('fuelType', filters.fuelType);
    if (filters?.year) params.append('year', filters.year.toString());

    const response = await this.api.get(`/routes?${params.toString()}`);
    return response.data;
  }

  async getRouteById(id: string): Promise<Route> {
    const response = await this.api.get(`/routes/${id}`);
    return response.data;
  }

  async setBaseline(id: string): Promise<Route> {
    const response = await this.api.post(`/routes/${id}/baseline`);
    return response.data;
  }

  async getComparison(): Promise<RouteComparison[]> {
    const response = await this.api.get('/routes/comparison');
    return response.data;
  }
}
