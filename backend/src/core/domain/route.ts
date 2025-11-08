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
  createdAt: Date;
  updatedAt: Date;
}

export enum VesselType {
  CONTAINER = 'Container',
  BULK_CARRIER = 'BulkCarrier',
  TANKER = 'Tanker',
  RORO = 'RoRo',
}

export enum FuelType {
  HFO = 'HFO', // Heavy Fuel Oil
  LNG = 'LNG', // Liquefied Natural Gas
  MGO = 'MGO', // Marine Gas Oil
}

export interface RouteComparison {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
  targetIntensity: number;
}

export interface CreateRouteDto {
  routeId: string;
  vesselType: VesselType;
  fuelType: FuelType;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
}
