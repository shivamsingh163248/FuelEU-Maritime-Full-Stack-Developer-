import React, { useState, useEffect } from 'react';
import { useRoutes } from '../adapters/ui/hooks/useRoutes';

interface PoolMember {
  shipId: string;
  vesselName: string;
  cbBefore: number;
  cbAfter: number;
  allocation: number;
}

interface Pool {
  id: string;
  name: string;
  year: number;
  members: PoolMember[];
  totalCbBefore: number;
  totalCbAfter: number;
  status: 'active' | 'draft' | 'completed';
  createdDate: string;
}

export const Pooling: React.FC = () => {
  const { routes, loading, error, fetchRoutes } = useRoutes();
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [pools, setPools] = useState<Pool[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'history'>('create');
  
  // Pool creation state
  const [poolName, setPoolName] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [poolMembers, setPoolMembers] = useState<PoolMember[]>([]);
  
  const TARGET_INTENSITY = 89.3368;

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    // Mock existing pools
    const mockPools: Pool[] = [
      {
        id: '1',
        name: 'North Atlantic Pool',
        year: 2023,
        members: [
          {
            shipId: '1',
            vesselName: 'Atlantic Explorer',
            cbBefore: -5.2,
            cbAfter: -2.1,
            allocation: 3.1
          },
          {
            shipId: '2',
            vesselName: 'Ocean Voyager',
            cbBefore: 8.4,
            cbAfter: 5.3,
            allocation: -3.1
          }
        ],
        totalCbBefore: 3.2,
        totalCbAfter: 3.2,
        status: 'completed',
        createdDate: '2023-12-15'
      }
    ];
    setPools(mockPools);
  }, []);

  const getComplianceBalance = (route: any) => {
    return TARGET_INTENSITY - route.ghgIntensity;
  };

  const addMemberToPool = (shipId: string) => {
    if (selectedMembers.includes(shipId)) return;
    
    const route = routes.find(r => r.id === shipId);
    if (!route) return;

    const cbBefore = getComplianceBalance(route);
    const newMember: PoolMember = {
      shipId,
      vesselName: route.vesselName,
      cbBefore,
      cbAfter: cbBefore, // Initially same as before
      allocation: 0
    };

    setSelectedMembers([...selectedMembers, shipId]);
    setPoolMembers([...poolMembers, newMember]);
  };

  const removeMemberFromPool = (shipId: string) => {
    setSelectedMembers(selectedMembers.filter(id => id !== shipId));
    setPoolMembers(poolMembers.filter(m => m.shipId !== shipId));
  };

  const updateMemberAllocation = (shipId: string, allocation: number) => {
    setPoolMembers(poolMembers.map(member => 
      member.shipId === shipId 
        ? { ...member, allocation, cbAfter: member.cbBefore + allocation }
        : member
    ));
  };

  const getTotalCbBefore = () => {
    return poolMembers.reduce((sum, member) => sum + member.cbBefore, 0);
  };

  const getTotalAllocation = () => {
    return poolMembers.reduce((sum, member) => sum + member.allocation, 0);
  };

  const isPoolValid = () => {
    const totalCb = getTotalCbBefore();
    const totalAllocation = getTotalAllocation();
    
    // Check basic rules
    if (poolMembers.length < 2 || poolMembers.length > 50) return false;
    if (totalCb < 0) return false;
    if (Math.abs(totalAllocation) > 0.01) return false; // Should sum to ~0
    
    // Check Article 21 rules
    for (const member of poolMembers) {
      // Deficit ships cannot exit worse
      if (member.cbBefore < 0 && member.cbAfter < member.cbBefore) return false;
      // Surplus ships cannot exit negative
      if (member.cbBefore > 0 && member.cbAfter < 0) return false;
    }
    
    return true;
  };

  const createPool = () => {
    if (!poolName.trim()) {
      alert('Please enter a pool name');
      return;
    }

    if (!isPoolValid()) {
      alert('Pool configuration is invalid. Please check Article 21 rules.');
      return;
    }

    const newPool: Pool = {
      id: Date.now().toString(),
      name: poolName,
      year: selectedYear,
      members: [...poolMembers],
      totalCbBefore: getTotalCbBefore(),
      totalCbAfter: getTotalCbBefore(), // Same as before in total
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setPools([newPool, ...pools]);
    
    // Reset form
    setPoolName('');
    setSelectedMembers([]);
    setPoolMembers([]);
    
    alert(`Pool "${poolName}" created successfully!`);
  };

  const calculateOptimalAllocation = () => {
    if (poolMembers.length === 0) return;

    // Simple greedy allocation algorithm
    const deficitMembers = poolMembers.filter(m => m.cbBefore < 0).sort((a, b) => a.cbBefore - b.cbBefore);
    const surplusMembers = poolMembers.filter(m => m.cbBefore > 0).sort((a, b) => b.cbBefore - a.cbBefore);
    
    const updatedMembers = [...poolMembers];
    
    // Reset allocations
    updatedMembers.forEach(member => {
      member.allocation = 0;
      member.cbAfter = member.cbBefore;
    });

    // Allocate surplus to deficit
    for (const deficitMember of deficitMembers) {
      let remainingDeficit = Math.abs(deficitMember.cbBefore);
      
      for (const surplusMember of surplusMembers) {
        if (remainingDeficit <= 0) break;
        
        const availableSurplus = surplusMember.cbBefore + surplusMember.allocation;
        if (availableSurplus <= 0) continue;
        
        const transferAmount = Math.min(remainingDeficit, availableSurplus);
        
        // Update allocations
        const deficitIndex = updatedMembers.findIndex(m => m.shipId === deficitMember.shipId);
        const surplusIndex = updatedMembers.findIndex(m => m.shipId === surplusMember.shipId);
        
        updatedMembers[deficitIndex].allocation += transferAmount;
        updatedMembers[deficitIndex].cbAfter += transferAmount;
        updatedMembers[surplusIndex].allocation -= transferAmount;
        updatedMembers[surplusIndex].cbAfter -= transferAmount;
        
        remainingDeficit -= transferAmount;
      }
    }

    setPoolMembers(updatedMembers);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pooling</h1>
            <p className="text-gray-600 mt-1">
              Create pools and manage member allocations per Article 21
            </p>
          </div>
          <div className="text-right">
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
              Year
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Active Pools
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {pools.filter(p => p.status === 'active').length}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Currently active
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Total Members
          </div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {pools.reduce((sum, pool) => sum + pool.members.length, 0)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Across all pools
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Available Vessels
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {routes.length}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            For pooling
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Pool
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Pools
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pool History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Create Pool Tab */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Pool</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pool Name
                    </label>
                    <input
                      type="text"
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter pool name..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Vessel to Pool
                    </label>
                    <select
                      onChange={(e) => e.target.value && addMemberToPool(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value=""
                    >
                      <option value="">Select a vessel...</option>
                      {routes
                        .filter(route => !selectedMembers.includes(route.id))
                        .map(route => (
                          <option key={route.id} value={route.id}>
                            {route.vesselName} (CB: {getComplianceBalance(route).toFixed(2)})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Pool Members Table */}
                {poolMembers.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900">
                        Pool Members ({poolMembers.length})
                      </h4>
                      <button
                        onClick={calculateOptimalAllocation}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Auto-Allocate
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CB Before</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocation</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CB After</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {poolMembers.map((member) => (
                            <tr key={member.shipId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {member.vesselName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={member.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {member.cbBefore >= 0 ? '+' : ''}{member.cbBefore.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={member.allocation}
                                  onChange={(e) => updateMemberAllocation(member.shipId, parseFloat(e.target.value) || 0)}
                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={member.cbAfter >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {member.cbAfter >= 0 ? '+' : ''}{member.cbAfter.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => removeMemberFromPool(member.shipId)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pool Summary */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-gray-500">Total CB Before</div>
                        <div className={`font-medium ${getTotalCbBefore() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {getTotalCbBefore().toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-gray-500">Total Allocation</div>
                        <div className={`font-medium ${Math.abs(getTotalAllocation()) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                          {getTotalAllocation().toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-gray-500">Pool Status</div>
                        <div className={`font-medium ${isPoolValid() ? 'text-green-600' : 'text-red-600'}`}>
                          {isPoolValid() ? 'Valid' : 'Invalid'}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-gray-500">Members</div>
                        <div className="font-medium text-gray-900">
                          {poolMembers.length}/50
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={createPool}
                  disabled={!isPoolValid() || !poolName.trim()}
                  className={`px-4 py-2 rounded-md font-medium ${
                    isPoolValid() && poolName.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Create Pool
                </button>
              </div>
            </div>
          )}

          {/* Manage Pools Tab */}
          {activeTab === 'manage' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Pools</h3>
              
              {pools.filter(p => p.status === 'active').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active pools found
                </div>
              ) : (
                <div className="space-y-4">
                  {pools.filter(p => p.status === 'active').map((pool) => (
                    <div key={pool.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{pool.name}</h4>
                          <p className="text-sm text-gray-600">
                            {pool.members.length} members • Year: {pool.year}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                          Active
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CB Before</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Allocation</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CB After</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {pool.members.map((member) => (
                              <tr key={member.shipId}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  {member.vesselName}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={member.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {member.cbBefore >= 0 ? '+' : ''}{member.cbBefore.toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={member.allocation >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {member.allocation >= 0 ? '+' : ''}{member.allocation.toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={member.cbAfter >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {member.cbAfter >= 0 ? '+' : ''}{member.cbAfter.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pool History</h3>
              
              {pools.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pool history found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pool Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total CB</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pools.map((pool) => (
                        <tr key={pool.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {pool.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pool.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pool.members.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={pool.totalCbBefore >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {pool.totalCbBefore >= 0 ? '+' : ''}{pool.totalCbBefore.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              pool.status === 'active' ? 'bg-green-100 text-green-800' :
                              pool.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pool.createdDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Article 21 Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Article 21: Pooling Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <ul className="space-y-1">
            <li>• Pool size: 2-50 members maximum</li>
            <li>• Sum of adjusted CB must be ≥ 0</li>
            <li>• Deficit ships cannot exit worse than before</li>
          </ul>
          <ul className="space-y-1">
            <li>• Surplus ships cannot exit with negative CB</li>
            <li>• Total allocations must sum to zero</li>
            <li>• Optimal allocation uses greedy algorithm</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
