export function CompareTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Baseline vs Target Comparison</h2>
        <p className="mt-1 text-sm text-gray-500">
          Compare baseline routes with target intensity (89.3368 gCO₂e/MJ).
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Comparison Table</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Comparison data table will be implemented here.</p>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Chart</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">GHG intensity comparison chart will be implemented here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
