import { 
  ComplianceBalance, 
  BankEntry, 
  Pool, 
  PoolMember, 
  CreateBankEntryDto, 
  CreatePoolDto
} from '../domain/compliance';

export interface ComplianceRepository {
  findComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance | null>;
  createComplianceBalance(cb: Omit<ComplianceBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceBalance>;
  updateComplianceBalance(id: string, updates: Partial<ComplianceBalance>): Promise<ComplianceBalance>;
}

export interface BankRepository {
  findBankEntries(shipId: string, year?: number): Promise<BankEntry[]>;
  createBankEntry(entry: CreateBankEntryDto): Promise<BankEntry>;
  getTotalBankedAmount(shipId: string): Promise<number>;
  getAvailableBankedAmount(shipId: string, year: number): Promise<number>;
}

export interface PoolRepository {
  createPool(pool: CreatePoolDto): Promise<Pool>;
  findPoolById(id: string): Promise<Pool | null>;
  findPoolMembers(poolId: string): Promise<PoolMember[]>;
  addPoolMember(poolId: string, member: Omit<PoolMember, 'id' | 'poolId'>): Promise<PoolMember>;
}
