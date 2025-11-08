import { ComplianceBalance, AdjustedComplianceBalance } from '../domain/compliance';
import { ComplianceRepository, BankRepository } from '../ports/compliance-repository';
import { RouteRepository } from '../ports/route-repository';
import { FUEL_EU_CONSTANTS, FuelEUError, ERROR_CODES } from '../../shared/constants';
import { roundToDecimal } from '../../shared/utils';

export class ComplianceService {
  constructor(
    private complianceRepository: ComplianceRepository,
    private bankRepository: BankRepository,
    private routeRepository: RouteRepository
  ) {}

  /**
   * Calculate Compliance Balance (CB) for a ship in a given year
   * Formula: CB = (Target Intensity - Actual Intensity) × Energy in scope
   */
  async calculateComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance> {
    // For this demo, we'll use route data as proxy for ship data
    const routes = await this.routeRepository.findAll({ year });
    
    if (routes.length === 0) {
      throw new FuelEUError('No routes found for the specified year', ERROR_CODES.ROUTE_NOT_FOUND, 404);
    }

    // Use first route as representative (in real app, this would be ship-specific)
    const route = routes[0];
    
    const targetIntensity = (FUEL_EU_CONSTANTS.TARGET_INTENSITY as any)[year] || FUEL_EU_CONSTANTS.TARGET_INTENSITY[2025];
    const actualIntensity = route.ghgIntensity;
    const energyInScope = route.fuelConsumption * FUEL_EU_CONSTANTS.ENERGY_CONVERSION_FACTOR;
    
    const cbGco2eq = roundToDecimal((targetIntensity - actualIntensity) * energyInScope);

    const existingCb = await this.complianceRepository.findComplianceBalance(shipId, year);
    
    if (existingCb) {
      return this.complianceRepository.updateComplianceBalance(existingCb.id, {
        cbGco2eq,
        energyInScope,
        actualIntensity,
        targetIntensity,
        updatedAt: new Date(),
      });
    }

    return this.complianceRepository.createComplianceBalance({
      shipId,
      year,
      cbGco2eq,
      energyInScope,
      actualIntensity,
      targetIntensity,
    });
  }

  async getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance> {
    let cb = await this.complianceRepository.findComplianceBalance(shipId, year);
    
    if (!cb) {
      cb = await this.calculateComplianceBalance(shipId, year);
    }
    
    return cb;
  }

  /**
   * Get adjusted CB after applying banked amounts
   */
  async getAdjustedComplianceBalance(shipId: string, year: number): Promise<AdjustedComplianceBalance> {
    const cb = await this.getComplianceBalance(shipId, year);
    const bankedAmount = await this.bankRepository.getTotalBankedAmount(shipId);
    
    return {
      shipId,
      year,
      originalCb: cb.cbGco2eq,
      bankedAmount,
      adjustedCb: cb.cbGco2eq + bankedAmount,
    };
  }
}
