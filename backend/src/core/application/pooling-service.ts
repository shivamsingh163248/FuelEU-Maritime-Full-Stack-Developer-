import { Pool, PoolMember, CreatePoolDto } from '../domain/compliance';
import { PoolRepository } from '../ports/compliance-repository';
import { FUEL_EU_CONSTANTS, FuelEUError, ERROR_CODES } from '../../shared/constants';
import { roundToDecimal } from '../../shared/utils';

export class PoolingService {
  constructor(
    private poolRepository: PoolRepository
  ) {}

  /**
   * Create a pool following Article 21 rules
   * - Sum of adjusted CB must be >= 0
   * - Deficit ships cannot exit worse
   * - Surplus ships cannot exit negative
   */
  async createPool(poolData: CreatePoolDto): Promise<{ pool: Pool; members: PoolMember[] }> {
    // Validate pool size
    if (poolData.members.length < FUEL_EU_CONSTANTS.POOLING.MIN_POOL_SIZE) {
      throw new FuelEUError(
        `Pool must have at least ${FUEL_EU_CONSTANTS.POOLING.MIN_POOL_SIZE} members`,
        ERROR_CODES.INVALID_POOL_CONFIGURATION,
        400
      );
    }

    if (poolData.members.length > FUEL_EU_CONSTANTS.POOLING.MAX_POOL_SIZE) {
      throw new FuelEUError(
        `Pool cannot exceed ${FUEL_EU_CONSTANTS.POOLING.MAX_POOL_SIZE} members`,
        ERROR_CODES.INVALID_POOL_CONFIGURATION,
        400
      );
    }

    // Calculate total CB
    const totalCb = poolData.members.reduce((sum, member) => sum + member.cbBefore, 0);
    if (totalCb < 0) {
      throw new FuelEUError(
        'Pool sum cannot be negative',
        ERROR_CODES.POOL_SUM_NEGATIVE,
        400
      );
    }

    // Create pool
    const pool = await this.poolRepository.createPool(poolData);

    // Calculate allocation using greedy algorithm
    const members = this.calculatePoolAllocation(poolData.members);

    // Validate allocation rules
    this.validatePoolAllocation(poolData.members, members);

    // Save pool members
    const savedMembers: PoolMember[] = [];
    for (const member of members) {
      const savedMember = await this.poolRepository.addPoolMember(pool.id, member);
      savedMembers.push(savedMember);
    }

    return { pool, members: savedMembers };
  }

  /**
   * Greedy allocation algorithm for pooling
   * Sort members by CB descending, transfer surplus to deficits
   */
  private calculatePoolAllocation(
    inputMembers: { shipId: string; cbBefore: number }[]
  ): Omit<PoolMember, 'id' | 'poolId'>[] {
    const members = inputMembers.map(m => ({
      shipId: m.shipId,
      cbBefore: m.cbBefore,
      cbAfter: m.cbBefore, // Start with original CB
    }));

    // Sort by CB descending (surplus ships first)
    members.sort((a, b) => b.cbBefore - a.cbBefore);

    // Transfer surplus to deficits
    for (let i = 0; i < members.length; i++) {
      const surplusShip = members[i];
      if (surplusShip.cbAfter <= 0) break; // No more surplus

      for (let j = members.length - 1; j >= 0; j--) {
        const deficitShip = members[j];
        if (deficitShip.cbAfter >= 0) break; // No more deficits

        // Calculate transfer amount
        const transferAmount = Math.min(surplusShip.cbAfter, -deficitShip.cbAfter);
        
        // Perform transfer
        surplusShip.cbAfter = roundToDecimal(surplusShip.cbAfter - transferAmount);
        deficitShip.cbAfter = roundToDecimal(deficitShip.cbAfter + transferAmount);

        if (surplusShip.cbAfter <= 0) break; // Surplus exhausted
      }
    }

    return members;
  }

  /**
   * Validate pooling rules
   */
  private validatePoolAllocation(
    inputMembers: { shipId: string; cbBefore: number }[],
    outputMembers: { shipId: string; cbBefore: number; cbAfter: number }[]
  ): void {
    for (const output of outputMembers) {
      const input = inputMembers.find(m => m.shipId === output.shipId);
      if (!input) continue;

      // Rule: Deficit ship cannot exit worse
      if (input.cbBefore < 0 && output.cbAfter < input.cbBefore) {
        throw new FuelEUError(
          `Deficit ship ${output.shipId} cannot exit worse than original CB`,
          ERROR_CODES.DEFICIT_SHIP_WORSE,
          400
        );
      }

      // Rule: Surplus ship cannot exit negative
      if (input.cbBefore > 0 && output.cbAfter < 0) {
        throw new FuelEUError(
          `Surplus ship ${output.shipId} cannot exit with negative CB`,
          ERROR_CODES.SURPLUS_SHIP_NEGATIVE,
          400
        );
      }
    }
  }
}
