// FuelEU Maritime constants based on regulation
export const FUEL_EU_CONSTANTS = {
  // Target intensities by year (gCO₂e/MJ)
  TARGET_INTENSITY: {
    2025: 89.3368, // 2% below 91.16
    2030: 87.96,   // Projected value
    2035: 82.04,   // Projected value
  },
  
  // Energy conversion factor
  ENERGY_CONVERSION_FACTOR: 41000, // MJ per tonne of fuel
  
  // Banking rules (Article 20)
  BANKING: {
    MAX_BANK_PERCENTAGE: 0.2, // 20% of positive CB
    MAX_APPLY_YEARS: 3, // Can apply banked amount within 3 years
  },
  
  // Pooling rules (Article 21)
  POOLING: {
    MIN_POOL_SIZE: 2,
    MAX_POOL_SIZE: 100,
  },
} as const;

export class FuelEUError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'FuelEUError';
  }
}

export const ERROR_CODES = {
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  BASELINE_NOT_SET: 'BASELINE_NOT_SET',
  INVALID_CB_AMOUNT: 'INVALID_CB_AMOUNT',
  INSUFFICIENT_BANKED_AMOUNT: 'INSUFFICIENT_BANKED_AMOUNT',
  INVALID_POOL_CONFIGURATION: 'INVALID_POOL_CONFIGURATION',
  POOL_SUM_NEGATIVE: 'POOL_SUM_NEGATIVE',
  DEFICIT_SHIP_WORSE: 'DEFICIT_SHIP_WORSE',
  SURPLUS_SHIP_NEGATIVE: 'SURPLUS_SHIP_NEGATIVE',
} as const;
