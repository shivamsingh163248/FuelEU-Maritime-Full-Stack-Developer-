export interface Route {
  id: string;
  routeId: string;
  vesselType: VesselType;
  fuelType: FuelType;
  year: number;
  ghgIntensity: number; // gCO₂e/MJ
  fuelConsumption: number; // tonnes
  distance: number; // km
  totalEmissions: number; // tonnes
  isBaseline: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VesselType = 'Container' | 'BulkCarrier' | 'Tanker' | 'RoRo';

export type FuelType = 'HFO' | 'LNG' | 'MGO';

export interface RouteComparison {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
  targetIntensity: number;
}

export interface RouteFilters {
  vesselType?: VesselType;
  fuelType?: FuelType;
  year?: number;
}
