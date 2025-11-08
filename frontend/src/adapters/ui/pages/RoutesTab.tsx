import { useState } from 'react';
import type { RouteFilters, VesselType, FuelType } from '../../../core/domain/route';
import { useRoutes } from '../hooks/useRoutes';
import { RouteFilters as RouteFiltersComponent } from '../components/RouteFilters';
import { RouteTable } from '../components/RouteTable';

export function RoutesTab() {
  const [filters, setFilters] = useState<RouteFilters>({});
  const { routes, loading, error, setBaseline } = useRoutes(filters);

  const handleFilterChange = (newFilters: {
    vesselType?: VesselType;
    fuelType?: FuelType;
    year?: number;
  }) => {
    setFilters(newFilters);
  };

  const handleSetBaseline = async (routeId: string) => {
    try {
      await setBaseline(routeId);
    } catch (err) {
      // Error is handled by the useRoutes hook
      console.error('Failed to set baseline:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Routes Management</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage route data, set baselines, and apply filters.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <RouteFiltersComponent
        vesselType={filters.vesselType}
        fuelType={filters.fuelType}
        year={filters.year}
        onFilterChange={handleFilterChange}
      />

      <div>
        <div className="sm:flex sm:items-center mb-4">
          <div className="sm:flex-auto">
            <h3 className="text-lg font-medium text-gray-900">
              Routes ({routes.length})
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {routes.filter(r => r.isBaseline).length > 0 
                ? `Baseline set: ${routes.find(r => r.isBaseline)?.routeId}`
                : 'No baseline route selected'
              }
            </p>
          </div>
        </div>

        <RouteTable
          routes={routes}
          loading={loading}
          onSetBaseline={handleSetBaseline}
        />
      </div>
    </div>
  );
}
