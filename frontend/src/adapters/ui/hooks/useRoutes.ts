import { useState, useCallback } from 'react';
import type { Route, RouteFilters, VesselType, FuelType } from '../../../core/domain/route';
import { ApiRouteService } from '../../infrastructure/api-route-service';

const routeService = new ApiRouteService();

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRoutes = useCallback(async (filters: RouteFilters = { vesselType: undefined, fuelType: undefined, year: undefined }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await routeService.getAllRoutes(filters);
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch routes'));
    } finally {
      setLoading(false);
    }
  }, []);

  const setBaseline = useCallback(async (routeId: string) => {
    try {
      setError(null);
      await routeService.setBaseline(routeId);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to set baseline');
    }
  }, []);

  return {
    routes,
    loading,
    error,
    fetchRoutes,
    setBaseline,
  };
}
