import type { VesselType, FuelType } from '../../../core/domain/route';

interface FilterProps {
  vesselType?: VesselType;
  fuelType?: FuelType;
  year?: number;
  onFilterChange: (filters: {
    vesselType?: VesselType;
    fuelType?: FuelType;
    year?: number;
  }) => void;
}

const vesselTypes: VesselType[] = [
  'Container' as VesselType,
  'BulkCarrier' as VesselType,
  'Tanker' as VesselType,
  'RoRo' as VesselType,
];

const fuelTypes: FuelType[] = [
  'HFO' as FuelType,
  'LNG' as FuelType,
  'MGO' as FuelType,
];

const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function RouteFilters({ vesselType, fuelType, year, onFilterChange }: FilterProps) {
  const handleVesselTypeChange = (value: string) => {
    onFilterChange({
      vesselType: value ? (value as VesselType) : undefined,
      fuelType,
      year,
    });
  };

  const handleFuelTypeChange = (value: string) => {
    onFilterChange({
      vesselType,
      fuelType: value ? (value as FuelType) : undefined,
      year,
    });
  };

  const handleYearChange = (value: string) => {
    onFilterChange({
      vesselType,
      fuelType,
      year: value ? parseInt(value) : undefined,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="vessel-type" className="block text-sm font-medium text-gray-700 mb-1">
            Vessel Type
          </label>
          <select
            id="vessel-type"
            value={vesselType || ''}
            onChange={(e) => handleVesselTypeChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="">All Types</option>
            {vesselTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fuel-type" className="block text-sm font-medium text-gray-700 mb-1">
            Fuel Type
          </label>
          <select
            id="fuel-type"
            value={fuelType || ''}
            onChange={(e) => handleFuelTypeChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="">All Fuels</option>
            {fuelTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            id="year"
            value={year || ''}
            onChange={(e) => handleYearChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="">All Years</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={clearFilters}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
