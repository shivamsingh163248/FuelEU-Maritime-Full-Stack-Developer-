export function BankingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Banking (Article 20)</h2>
        <p className="mt-1 text-sm text-gray-500">
          Bank positive compliance balance and apply banked surplus to deficits.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Balance</h3>
          <div className="text-center py-8">
            <div className="text-2xl font-bold text-gray-900">--</div>
            <p className="text-sm text-gray-500">gCO₂e</p>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Banked Amount</h3>
          <div className="text-center py-8">
            <div className="text-2xl font-bold text-success">--</div>
            <p className="text-sm text-gray-500">gCO₂e banked</p>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available to Apply</h3>
          <div className="text-center py-8">
            <div className="text-2xl font-bold text-primary-600">--</div>
            <p className="text-sm text-gray-500">gCO₂e available</p>
          </div>
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Banking Actions</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Banking interface will be implemented here.</p>
        </div>
      </div>
    </div>
  );
}
