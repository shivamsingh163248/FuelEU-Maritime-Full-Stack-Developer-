import type { Route } from '../../../core/domain/route';

interface RouteTableProps {
  routes: Route[];
  loading: boolean;
  onSetBaseline: (routeId: string) => void;
}

export function RouteTable({ routes, loading, onSetBaseline }: RouteTableProps) {
  if (loading) {
    return (
      <div className="card p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading routes...</p>
        </div>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="card p-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No routes found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters to see more results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Route ID</th>
              <th className="table-header">Vessel Type</th>
              <th className="table-header">Fuel Type</th>
              <th className="table-header">Year</th>
              <th className="table-header">GHG Intensity (gCO₂e/MJ)</th>
              <th className="table-header">Fuel Consumption (t)</th>
              <th className="table-header">Distance (km)</th>
              <th className="table-header">Total Emissions (t)</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{route.routeId}</div>
                    {route.isBaseline && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Baseline
                      </span>
                    )}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900">{route.vesselType}</div>
                </td>
                <td className="table-cell">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {route.fuelType}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900">{route.year}</div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900">{route.ghgIntensity.toFixed(4)}</div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900">{route.fuelConsumption.toLocaleString()}</div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900">{route.distance.toLocaleString()}</div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900">{route.totalEmissions.toLocaleString()}</div>
                </td>
                <td className="table-cell">
                  <ComplianceStatus ghgIntensity={route.ghgIntensity} />
                </td>
                <td className="table-cell">
                  {!route.isBaseline && (
                    <button
                      onClick={() => onSetBaseline(route.id)}
                      className="btn btn-primary text-xs"
                    >
                      Set Baseline
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceStatus({ ghgIntensity }: { ghgIntensity: number }) {
  const targetIntensity = 89.3368; // 2025 target
  const isCompliant = ghgIntensity <= targetIntensity;
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isCompliant
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {isCompliant ? (
        <>
          <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
            <circle cx={4} cy={4} r={3} />
          </svg>
          Compliant
        </>
      ) : (
        <>
          <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
            <circle cx={4} cy={4} r={3} />
          </svg>
          Non-Compliant
        </>
      )}
    </span>
  );
}
