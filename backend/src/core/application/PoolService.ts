// Pool Service Implementation
// Business logic for pooling operations and member management

import { IPoolService } from '../ports/IServices';
import { IPoolRepository, IPoolMemberRepository } from '../ports/IRepositories';
import { Pool, PoolData, PoolMember, PoolMemberData } from '../domain/Pool';

export class PoolService implements IPoolService {
  constructor(
    private readonly poolRepository: IPoolRepository,
    private readonly poolMemberRepository: IPoolMemberRepository
  ) {}

  async createPool(poolData: PoolData): Promise<Pool> {
    // Validate pool data
    this.validatePoolData(poolData);
    
    // Create pool domain object
    const pool = Pool.create(poolData);
    
    // Save to repository
    return await this.poolRepository.create(pool);
  }

  async getPoolById(id: number): Promise<Pool> {
    const pool = await this.poolRepository.findById(id);
    if (!pool) {
      throw new Error(`Pool with id ${id} not found`);
    }
    return pool;
  }

  async getAllPools(): Promise<Pool[]> {
    return await this.poolRepository.findAll();
  }

  async updatePool(id: number, poolData: Partial<PoolData>): Promise<Pool> {
    const existingPool = await this.getPoolById(id);
    
    // Merge existing data with updates
    const updatedData: PoolData = {
      ...existingPool.toData(),
      ...poolData
    };
    
    // Validate updated data
    this.validatePoolData(updatedData);
    
    // Create updated pool domain object
    const updatedPool = Pool.create(updatedData);
    
    return await this.poolRepository.update(id, updatedPool);
  }

  async deletePool(id: number): Promise<void> {
    const pool = await this.getPoolById(id); // Ensure pool exists
    
    // Check if pool has active members
    const members = await this.poolMemberRepository.findActiveMembers(id);
    if (members.length > 0) {
      throw new Error(`Cannot delete pool with ${members.length} active members`);
    }
    
    await this.poolRepository.delete(id);
  }

  async addMemberToPool(poolId: number, memberData: PoolMemberData): Promise<PoolMember> {
    // Validate member data
    this.validatePoolMemberData(memberData);
    
    // Check if pool exists and can accept new members
    const pool = await this.getPoolById(poolId);
    if (!pool.canAcceptNewMembers()) {
      throw new Error('Pool cannot accept new members (inactive or at capacity)');
    }
    
    // Check if ship is already a member
    const existingMembership = await this.poolMemberRepository.checkMembershipExists(
      memberData.shipId, 
      poolId
    );
    
    if (existingMembership) {
      throw new Error(`Ship ${memberData.shipId} is already a member of this pool`);
    }
    
    // Set pool ID and join date
    const completeData: PoolMemberData = {
      ...memberData,
      poolId,
      joinDate: memberData.joinDate || new Date(),
      status: 'active'
    };
    
    // Create pool member domain object
    const poolMember = PoolMember.create(completeData);
    
    // Save to repository
    const createdMember = await this.poolMemberRepository.create(poolMember);
    
    // Update pool statistics
    await this.updatePoolStatistics(poolId);
    
    return createdMember;
  }

  async removeMemberFromPool(poolId: number, shipId: string): Promise<void> {
    if (!shipId || shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    
    // Find member
    const members = await this.poolMemberRepository.findByShipId(shipId);
    const poolMember = members.find(m => m.getPoolId() === poolId && m.getStatus() === 'active');
    
    if (!poolMember) {
      throw new Error(`Ship ${shipId} is not an active member of pool ${poolId}`);
    }
    
    // Update member status to withdrawn
    const updatedMemberData: PoolMemberData = {
      ...poolMember.toData(),
      status: 'withdrawn',
      withdrawalDate: new Date()
    };
    
    const updatedMember = PoolMember.create(updatedMemberData);
    await this.poolMemberRepository.update(poolMember.getId()!, updatedMember);
    
    // Update pool statistics
    await this.updatePoolStatistics(poolId);
  }

  async getPoolMembers(poolId: number): Promise<PoolMember[]> {
    return await this.poolMemberRepository.findByPoolId(poolId);
  }

  async getMembersByShip(shipId: string): Promise<PoolMember[]> {
    if (!shipId || shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    return await this.poolMemberRepository.findByShipId(shipId);
  }

  async getActivePoolsForYear(year: number): Promise<Pool[]> {
    if (year < 2025 || year > 2050) {
      throw new Error('Year must be between 2025 and 2050');
    }
    return await this.poolRepository.findActivePoolsForYear(year);
  }

  async getPoolsAcceptingMembers(): Promise<Pool[]> {
    return await this.poolRepository.findPoolsAcceptingMembers();
  }

  async calculatePoolBalance(poolId: number): Promise<{
    totalSurplus: number;
    totalDeficit: number;
    netBalance: number;
    memberCount: number;
  }> {
    return await this.poolMemberRepository.calculatePoolContributions(poolId);
  }

  async redistributePoolCredits(poolId: number): Promise<{
    surplusCreditsAvailable: number;
    deficitCovered: number;
    remainingDeficit: number;
  }> {
    const pool = await this.getPoolById(poolId);
    return pool.calculateRedistribution();
  }

  async getPoolStatistics(): Promise<{
    totalPools: number;
    activePools: number;
    totalMembers: number;
    totalSurplus: number;
    totalDeficit: number;
    averagePoolSize: number;
  }> {
    return await this.poolRepository.getPoolStatistics();
  }

  async assessPoolHealth(poolId: number): Promise<'healthy' | 'balanced' | 'deficit_risk' | 'unsustainable'> {
    const pool = await this.getPoolById(poolId);
    return pool.assessPoolHealth();
  }

  async calculatePotentialSavings(poolId: number): Promise<number> {
    const pool = await this.getPoolById(poolId);
    return pool.calculatePotentialSavings();
  }

  private async updatePoolStatistics(poolId: number): Promise<void> {
    const contributions = await this.poolMemberRepository.calculatePoolContributions(poolId);
    const pool = await this.getPoolById(poolId);
    
    const updatedPool = pool.updatePoolStatistics(
      contributions.totalSurplus,
      contributions.totalDeficit,
      contributions.memberCount
    );
    
    await this.poolRepository.update(poolId, updatedPool);
  }

  private validatePoolData(poolData: PoolData): void {
    if (!poolData.poolName || poolData.poolName.trim().length === 0) {
      throw new Error('Pool name is required');
    }
    
    if (!poolData.adminCompany || poolData.adminCompany.trim().length === 0) {
      throw new Error('Admin company is required');
    }
    
    if (!['company', 'third_party', 'cooperative'].includes(poolData.poolType)) {
      throw new Error('Invalid pool type');
    }
    
    if (poolData.establishedYear < 2025 || poolData.establishedYear > 2050) {
      throw new Error('Established year must be between 2025 and 2050');
    }
    
    if (poolData.complianceYear < 2025 || poolData.complianceYear > 2050) {
      throw new Error('Compliance year must be between 2025 and 2050');
    }
    
    if (poolData.memberCount < 0) {
      throw new Error('Member count cannot be negative');
    }
    
    if (poolData.maxMembers !== undefined && poolData.maxMembers < 1) {
      throw new Error('Maximum members must be at least 1');
    }
    
    if (poolData.adminFeePercent !== undefined && (poolData.adminFeePercent < 0 || poolData.adminFeePercent > 100)) {
      throw new Error('Admin fee percent must be between 0 and 100');
    }
    
    if (poolData.joinFee !== undefined && poolData.joinFee < 0) {
      throw new Error('Join fee cannot be negative');
    }
  }

  private validatePoolMemberData(memberData: PoolMemberData): void {
    if (!memberData.shipId || memberData.shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    
    if (!memberData.shipName || memberData.shipName.trim().length === 0) {
      throw new Error('Ship name is required');
    }
    
    if (memberData.contributionAmount === undefined || memberData.contributionAmount === null) {
      throw new Error('Contribution amount is required');
    }
    
    if (!memberData.joinDate) {
      throw new Error('Join date is required');
    }
    
    if (memberData.status && !['active', 'pending', 'withdrawn'].includes(memberData.status)) {
      throw new Error('Invalid member status');
    }
  }
}
