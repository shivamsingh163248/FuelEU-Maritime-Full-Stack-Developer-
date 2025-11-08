import React, { useState, useEffect } from 'react';
import { useRoutes } from '../adapters/ui/hooks/useRoutes';

interface BankEntry {
  id: string;
  shipId: string;
  vesselName: string;
  year: number;
  amount: number;
  transactionType: 'deposit' | 'withdrawal';
  date: string;
  remainingBalance: number;
}

interface ComplianceBalance {
  shipId: string;
  vesselName: string;
  year: number;
  cbBalance: number;
  maxBankable: number; // 20% of positive CB
}

export const Banking: React.FC = () => {
  const { routes, loading, error, fetchRoutes } = useRoutes();
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [bankEntries, setBankEntries] = useState<BankEntry[]>([]);
  const [complianceBalances, setComplianceBalances] = useState<ComplianceBalance[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [bankAmount, setBankAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'bank' | 'withdraw' | 'history'>('bank');

  const TARGET_INTENSITY = 89.3368;

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    // Calculate compliance balances from routes
    const balances: ComplianceBalance[] = routes.map(route => {
      const cbBalance = TARGET_INTENSITY - route.ghgIntensity;
      const maxBankable = cbBalance > 0 ? cbBalance * 0.2 : 0; // 20% of positive CB

      return {
        shipId: route.id,
        vesselName: route.vesselName,
        year: selectedYear,
        cbBalance,
        maxBankable
      };
    });

    setComplianceBalances(balances);

    // Mock bank entries (in real app, these would come from API)
    const mockBankEntries: BankEntry[] = [
      {
        id: '1',
        shipId: routes[0]?.id || '1',
        vesselName: routes[0]?.vesselName || 'Mock Vessel',
        year: 2023,
        amount: 2.5,
        transactionType: 'deposit',
        date: '2023-12-15',
        remainingBalance: 2.5
      },
      {
        id: '2',
        shipId: routes[1]?.id || '2',
        vesselName: routes[1]?.vesselName || 'Mock Vessel 2',
        year: 2023,
        amount: 1.0,
        transactionType: 'withdrawal',
        date: '2024-03-10',
        remainingBalance: 1.5
      }
    ];

    setBankEntries(mockBankEntries);
  }, [routes, selectedYear]);

  const handleBankSurplus = () => {
    if (!selectedRoute || !bankAmount) {
      alert('Please select a route and enter an amount to bank');
      return;
    }

    const amount = parseFloat(bankAmount);
    const selectedBalance = complianceBalances.find(cb => cb.shipId === selectedRoute);

    if (!selectedBalance) {
      alert('Route not found');
      return;
    }

    if (selectedBalance.cbBalance <= 0) {
      alert('Cannot bank negative or zero compliance balance');
      return;
    }

    if (amount > selectedBalance.maxBankable) {
      alert(`Cannot bank more than 20% of positive CB. Maximum bankable: ${selectedBalance.maxBankable.toFixed(2)} gCO₂e/MJ`);
      return;
    }

    // Create new bank entry
    const newEntry: BankEntry = {
      id: Date.now().toString(),
      shipId: selectedRoute,
      vesselName: selectedBalance.vesselName,
      year: selectedYear,
      amount,
      transactionType: 'deposit',
      date: new Date().toISOString().split('T')[0],
      remainingBalance: amount // Simplified - would calculate based on existing balance
    };

    setBankEntries([newEntry, ...bankEntries]);
    setBankAmount('');
    setSelectedRoute('');
    alert(`Successfully banked ${amount} gCO₂e/MJ for ${selectedBalance.vesselName}`);
  };

  const handleWithdrawSurplus = () => {
    if (!selectedRoute || !withdrawAmount) {
      alert('Please select a route and enter an amount to withdraw');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const selectedBalance = complianceBalances.find(cb => cb.shipId === selectedRoute);

    if (!selectedBalance) {
      alert('Route not found');
      return;
    }

    // Check available banked amount (simplified)
    const availableBalance = bankEntries
      .filter(entry => entry.shipId === selectedRoute)
      .reduce((sum, entry) => {
        return entry.transactionType === 'deposit' ? sum + entry.amount : sum - entry.amount;
      }, 0);

    if (amount > availableBalance) {
      alert(`Insufficient banked balance. Available: ${availableBalance.toFixed(2)} gCO₂e/MJ`);
      return;
    }

    // Create withdrawal entry
    const newEntry: BankEntry = {
      id: Date.now().toString(),
      shipId: selectedRoute,
      vesselName: selectedBalance.vesselName,
      year: selectedYear,
      amount,
      transactionType: 'withdrawal',
      date: new Date().toISOString().split('T')[0],
      remainingBalance: availableBalance - amount
    };

    setBankEntries([newEntry, ...bankEntries]);
    setWithdrawAmount('');
    setSelectedRoute('');
    alert(`Successfully withdrew ${amount} gCO₂e/MJ for ${selectedBalance.vesselName}`);
  };

  const getTotalBankedBalance = () => {
    return bankEntries.reduce((sum, entry) => {
      return entry.transactionType === 'deposit' ? sum + entry.amount : sum - entry.amount;
    }, 0);
  };

  const getVesselBankedBalance = (shipId: string) => {
    return bankEntries
      .filter(entry => entry.shipId === shipId)
      .reduce((sum, entry) => {
        return entry.transactionType === 'deposit' ? sum + entry.amount : sum - entry.amount;
      }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CB Banking</h1>
            <p className="text-gray-600 mt-1">
              Manage CB banking and apply banked surplus according to Article 20
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
            Total Banked Balance
          </div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {getTotalBankedBalance().toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            gCO₂e/MJ available
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Total Bankable Surplus
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {complianceBalances.reduce((sum, cb) => sum + cb.maxBankable, 0).toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            gCO₂e/MJ (20% limit)
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Bank Transactions
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {bankEntries.length}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Total transactions
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('bank')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bank'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bank Surplus
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'withdraw'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Apply Banked
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Bank Surplus Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Positive CB (Max 20%)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Route
                    </label>
                    <select
                      value={selectedRoute}
                      onChange={(e) => setSelectedRoute(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select a route...</option>
                      {complianceBalances
                        .filter(cb => cb.cbBalance > 0)
                        .map(cb => (
                          <option key={cb.shipId} value={cb.shipId}>
                            {cb.vesselName} (CB: +{cb.cbBalance.toFixed(2)}, Max: {cb.maxBankable.toFixed(2)})
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Bank (gCO₂e/MJ)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter amount..."
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleBankSurplus}
                  disabled={!selectedRoute || !bankAmount}
                  className={`px-4 py-2 rounded-md font-medium ${
                    selectedRoute && bankAmount
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Bank Surplus
                </button>
              </div>

              {/* Available Balances */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Available CB for Banking</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CB Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Bankable (20%)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Already Banked</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {complianceBalances
                        .filter(cb => cb.cbBalance > 0)
                        .map(cb => (
                          <tr key={cb.shipId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {cb.vesselName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                              +{cb.cbBalance.toFixed(2)} gCO₂e/MJ
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                              {cb.maxBankable.toFixed(2)} gCO₂e/MJ
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getVesselBankedBalance(cb.shipId).toFixed(2)} gCO₂e/MJ
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Apply Banked Surplus</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Route
                    </label>
                    <select
                      value={selectedRoute}
                      onChange={(e) => setSelectedRoute(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select a route...</option>
                      {complianceBalances
                        .filter(cb => getVesselBankedBalance(cb.shipId) > 0)
                        .map(cb => (
                          <option key={cb.shipId} value={cb.shipId}>
                            {cb.vesselName} (Available: {getVesselBankedBalance(cb.shipId).toFixed(2)})
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Withdraw (gCO₂e/MJ)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter amount..."
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleWithdrawSurplus}
                  disabled={!selectedRoute || !withdrawAmount}
                  className={`px-4 py-2 rounded-md font-medium ${
                    selectedRoute && withdrawAmount
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Apply Banked Surplus
                </button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
              
              {bankEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No banking transactions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bankEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.vesselName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              entry.transactionType === 'deposit'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {entry.transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={entry.transactionType === 'deposit' ? 'text-green-600' : 'text-blue-600'}>
                              {entry.transactionType === 'deposit' ? '+' : '-'}{entry.amount.toFixed(2)} gCO₂e/MJ
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.remainingBalance.toFixed(2)} gCO₂e/MJ
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

      {/* Article 20 Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Article 20: CB Banking Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <ul className="space-y-1">
            <li>• Only positive CB can be banked</li>
            <li>• Maximum 20% of positive CB can be banked</li>
            <li>• Banked CB can be used in following years</li>
          </ul>
          <ul className="space-y-1">
            <li>• Banking helps with future compliance</li>
            <li>• Withdrawal applies to deficit CB</li>
            <li>• All transactions are tracked and auditable</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
