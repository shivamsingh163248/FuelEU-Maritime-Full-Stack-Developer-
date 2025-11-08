import React, { useState, useEffect } from 'react';
import { useRoutes } from '../adapters/ui/hooks/useRoutes';

interface ComplianceData {
  routeId: string;
  vesselName: string;
  actualIntensity: number;
  targetIntensity: number;
  complianceBalance: number;
  status: 'compliant' | 'non-compliant';
  year: number;
}

export const Compare: React.FC = () => {
  const { routes, loading, error, fetchRoutes } = useRoutes();
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
  
  // FuelEU Maritime target intensity (gCO₂e/MJ)
  const TARGET_INTENSITY = 89.3368;

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    // Calculate compliance data based on routes
    const calculatedData: ComplianceData[] = routes.map(route => {
      const actualIntensity = route.ghgIntensity;
      const complianceBalance = TARGET_INTENSITY - actualIntensity;
      const status = complianceBalance >= 0 ? 'compliant' : 'non-compliant';

      return {
        routeId: route.id,
        vesselName: route.vesselName,
        actualIntensity,
        targetIntensity: TARGET_INTENSITY,
        complianceBalance,
        status,
        year: route.departurePort ? 2024 : selectedYear
      };
    });

    setComplianceData(calculatedData);
  }, [routes, selectedYear]);

  const totalRoutes = complianceData.length;
  const compliantRoutes = complianceData.filter(d => d.status === 'compliant').length;
  const nonCompliantRoutes = totalRoutes - compliantRoutes;
  const complianceRate = totalRoutes > 0 ? (compliantRoutes / totalRoutes) * 100 : 0;
  
  const totalCB = complianceData.reduce((sum, d) => sum + d.complianceBalance, 0);
  const avgActualIntensity = totalRoutes > 0 ? 
    complianceData.reduce((sum, d) => sum + d.actualIntensity, 0) / totalRoutes : 0;

  const getStatusBadge = (status: string) => {
    return status === 'compliant' ? (
      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
        Compliant
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
        Non-Compliant
      </span>
    );
  };

  const getComplianceBarColor = (balance: number) => {
    if (balance >= 0) return 'bg-green-500';
    if (balance >= -5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Comparison</h1>
            <p className="text-gray-600 mt-1">
              Compare baseline vs target analysis with compliance indicators
            </p>
          </div>
          <div className="text-right">
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
              Analysis Year
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Compliance Rate
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {complianceRate.toFixed(1)}%
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {compliantRoutes} of {totalRoutes} routes
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Total CB Balance
          </div>
          <div className={`mt-2 text-3xl font-bold ${totalCB >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalCB.toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            gCO₂e/MJ
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Avg. Actual Intensity
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {avgActualIntensity.toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            gCO₂e/MJ
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Target Intensity
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {TARGET_INTENSITY.toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            gCO₂e/MJ (FuelEU)
          </div>
        </div>
      </div>

      {/* Compliance Status Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Compliance Rate Visual */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Compliant Routes</span>
              <span className="text-sm text-green-600">{compliantRoutes}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${complianceRate}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center mb-2 mt-4">
              <span className="text-sm font-medium text-gray-700">Non-Compliant Routes</span>
              <span className="text-sm text-red-600">{nonCompliantRoutes}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${100 - complianceRate}%` }}
              ></div>
            </div>
          </div>

          {/* Intensity Comparison */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Actual vs Target Intensity</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-600">Actual:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((avgActualIntensity / TARGET_INTENSITY) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{avgActualIntensity.toFixed(1)}</span>
              </div>
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-600">Target:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-green-500 h-2 rounded-full w-full"></div>
                </div>
                <span className="text-sm font-medium">{TARGET_INTENSITY.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Route Comparison */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Route-by-Route Comparison ({complianceData.length} routes)
        </h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">Error loading data: {error.message}</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading comparison data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vessel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Intensity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Intensity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CB Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complianceData.map((data) => (
                  <tr key={data.routeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {data.vesselName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.actualIntensity.toFixed(2)} gCO₂e/MJ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.targetIntensity.toFixed(2)} gCO₂e/MJ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${data.complianceBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.complianceBalance >= 0 ? '+' : ''}{data.complianceBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(data.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getComplianceBarColor(data.complianceBalance)}`}
                          style={{ 
                            width: `${Math.max(10, Math.min(100, ((data.complianceBalance + 10) / 20) * 100))}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions & Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Understanding the Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <ul className="space-y-1">
            <li>• <strong>CB Balance:</strong> Positive values indicate compliance surplus</li>
            <li>• <strong>Target Intensity:</strong> FuelEU Maritime target (89.3368 gCO₂e/MJ)</li>
            <li>• <strong>Compliance Rate:</strong> Percentage of compliant routes</li>
          </ul>
          <ul className="space-y-1">
            <li>• <strong>Green bars:</strong> Compliant performance</li>
            <li>• <strong>Yellow bars:</strong> Near-compliant (within 5 gCO₂e/MJ)</li>
            <li>• <strong>Red bars:</strong> Non-compliant performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
