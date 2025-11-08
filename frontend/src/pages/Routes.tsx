import React, { useState, useEffect } from 'react';
import { RouteTable } from '../adapters/ui/components/RouteTable';
import { RouteFilters } from '../adapters/ui/components/RouteFilters';
import { useRoutes } from '../adapters/ui/hooks/useRoutes';
import type { RouteFilters as IRouteFilters } from '../core/domain/route';

export const Routes: React.FC = () => {
  const { routes, loading, error, fetchRoutes, setBaseline } = useRoutes();
  const [filters, setFilters] = useState<IRouteFilters>({
    vesselType: undefined,
    fuelType: undefined,
    year: undefined
  });

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isSettingBaseline, setIsSettingBaseline] = useState(false);

  useEffect(() => {
    fetchRoutes(filters);
  }, [fetchRoutes, filters]);

  const handleSetBaseline = async () => {
    if (!selectedRouteId) {
      alert('Please select a route to set as baseline');
      return;
    }

    setIsSettingBaseline(true);
    try {
      await setBaseline(selectedRouteId);
      alert('Baseline set successfully!');
      setSelectedRouteId(null);
      // Refresh the routes to see updated baseline status
      await fetchRoutes(filters);
    } catch (error) {
      console.error('Failed to set baseline:', error);
      alert('Failed to set baseline. Please try again.');
    } finally {
      setIsSettingBaseline(false);
    }
  };

  const handleFilterChange = (newFilters: IRouteFilters) => {
    setFilters(newFilters);
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(selectedRouteId === routeId ? null : routeId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
            <p className="text-gray-600 mt-1">
              Manage vessel routes and set baseline for compliance calculations
            </p>
          </div>
          <button
            onClick={handleSetBaseline}
            disabled={!selectedRouteId || isSettingBaseline}
            className={`px-4 py-2 rounded-md font-medium ${
              selectedRouteId && !isSettingBaseline
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition-colors`}
          >
            {isSettingBaseline ? 'Setting...' : 'Set Baseline'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <RouteFilters 
          vesselType={filters.vesselType}
          fuelType={filters.fuelType}
          year={filters.year}
          onFilterChange={handleFilterChange} 
        />
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Routes ({routes.length})
          </h2>
          {selectedRouteId && (
            <p className="text-sm text-blue-600">
              Route selected for baseline setting
            </p>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">
              Error loading routes: {error.message}
            </p>
            <button
              onClick={() => fetchRoutes(filters)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        <RouteTable
          routes={routes}
          loading={loading}
          onSetBaseline={handleRouteSelect}
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use filters to narrow down routes by vessel type, fuel type, or year</li>
          <li>• Click on a route to select it for baseline setting</li>
          <li>• Click "Set Baseline" to designate the selected route as the baseline for compliance calculations</li>
          <li>• Baseline routes are marked with a special indicator in the table</li>
        </ul>
      </div>
    </div>
  );
};
