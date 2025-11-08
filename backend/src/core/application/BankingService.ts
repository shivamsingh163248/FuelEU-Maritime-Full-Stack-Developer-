// Banking Service Implementation
// Business logic for credit banking operations

import { IBankingService } from '../ports/IServices';
import { IBankEntryRepository } from '../ports/IRepositories';
import { BankEntry, BankEntryData } from '../domain/BankEntry';

export class BankingService implements IBankingService {
  constructor(private readonly bankEntryRepository: IBankEntryRepository) {}

  async createBankEntry(entryData: BankEntryData): Promise<BankEntry> {
    // Validate bank entry data
    this.validateBankEntryData(entryData);
    
    // Create bank entry domain object
    const bankEntry = BankEntry.create(entryData);
    
    // Save to repository
    return await this.bankEntryRepository.create(bankEntry);
  }

  async getBankEntryById(id: number): Promise<BankEntry> {
    const entry = await this.bankEntryRepository.findById(id);
    if (!entry) {
      throw new Error(`Bank entry with id ${id} not found`);
    }
    return entry;
  }

  async getAllBankEntries(): Promise<BankEntry[]> {
    return await this.bankEntryRepository.findAll();
  }

  async updateBankEntry(id: number, entryData: Partial<BankEntryData>): Promise<BankEntry> {
    const existingEntry = await this.getBankEntryById(id);
    
    // Merge existing data with updates
    const updatedData: BankEntryData = {
      ...existingEntry.toData(),
      ...entryData
    };
    
    // Validate updated data
    this.validateBankEntryData(updatedData);
    
    // Create updated bank entry domain object
    const updatedEntry = BankEntry.create(updatedData);
    
    return await this.bankEntryRepository.update(id, updatedEntry);
  }

  async deleteBankEntry(id: number): Promise<void> {
    await this.getBankEntryById(id); // Ensure entry exists
    await this.bankEntryRepository.delete(id);
  }

  async getBankEntriesByShip(shipId: string): Promise<BankEntry[]> {
    if (!shipId || shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    return await this.bankEntryRepository.findByShipId(shipId);
  }

  async calculateBankBalance(shipId: string): Promise<number> {
    if (!shipId || shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    return await this.bankEntryRepository.calculateBankBalance(shipId);
  }

  async depositSurplusCredits(shipId: string, creditAmount: number, sourceYear: number): Promise<BankEntry> {
    if (!shipId || shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    
    if (creditAmount <= 0) {
      throw new Error('Credit amount must be greater than 0');
    }
    
    if (sourceYear < 2025 || sourceYear > 2050) {
      throw new Error('Source year must be between 2025 and 2050');
    }
    
    // Check if surplus amount is valid (max 25% can be banked)
    // This would typically be validated against actual route surplus
    const description = `Surplus credit deposit from ${sourceYear} operations`;
    
    const depositEntry = BankEntry.createDeposit(
      shipId,
      creditAmount,
      sourceYear,
      description
    );
    
    return await this.bankEntryRepository.create(depositEntry);
  }

  async withdrawCredits(shipId: string, creditAmount: number, sourceYear: number): Promise<BankEntry> {
    if (!shipId || shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    
    if (creditAmount <= 0) {
      throw new Error('Credit amount must be greater than 0');
    }
    
    // Check if ship has sufficient credits
    const currentBalance = await this.calculateBankBalance(shipId);
    if (currentBalance < creditAmount) {
      throw new Error(`Insufficient credits. Available: ${currentBalance}, Requested: ${creditAmount}`);
    }
    
    // Get active credits to find appropriate source year
    const activeCredits = await this.bankEntryRepository.findActiveCredits(shipId);
    if (activeCredits.length === 0) {
      throw new Error('No active credits available for withdrawal');
    }
    
    // Use the oldest credits first (FIFO)
    const oldestCredit = activeCredits.reduce((oldest, current) => 
      current.getSourceYear() < oldest.getSourceYear() ? current : oldest
    );
    
    const description = `Credit withdrawal for compliance usage`;
    
    const withdrawalEntry = BankEntry.createWithdrawal(
      shipId,
      creditAmount,
      oldestCredit.getSourceYear(),
      description
    );
    
    return await this.bankEntryRepository.create(withdrawalEntry);
  }

  async transferCredits(fromShipId: string, toShipId: string, creditAmount: number): Promise<BankEntry> {
    if (!fromShipId || fromShipId.trim().length === 0) {
      throw new Error('Source ship ID is required');
    }
    
    if (!toShipId || toShipId.trim().length === 0) {
      throw new Error('Target ship ID is required');
    }
    
    if (fromShipId === toShipId) {
      throw new Error('Cannot transfer credits to the same ship');
    }
    
    if (creditAmount <= 0) {
      throw new Error('Credit amount must be greater than 0');
    }
    
    // Check if source ship has sufficient credits
    const sourceBalance = await this.calculateBankBalance(fromShipId);
    if (sourceBalance < creditAmount) {
      throw new Error(`Insufficient credits in source ship. Available: ${sourceBalance}, Requested: ${creditAmount}`);
    }
    
    // Get active credits from source ship
    const sourceCredits = await this.bankEntryRepository.findActiveCredits(fromShipId);
    if (sourceCredits.length === 0) {
      throw new Error('No active credits available for transfer');
    }
    
    // Use the oldest credits first (FIFO)
    const oldestCredit = sourceCredits.reduce((oldest, current) => 
      current.getSourceYear() < oldest.getSourceYear() ? current : oldest
    );
    
    const description = `Credit transfer from ${fromShipId} to ${toShipId}`;
    
    // Create transfer entry for source ship
    const transferEntry = BankEntry.createTransfer(
      fromShipId,
      toShipId,
      creditAmount,
      oldestCredit.getSourceYear(),
      description
    );
    
    // Create corresponding deposit entry for target ship
    const depositEntry = BankEntry.createDeposit(
      toShipId,
      creditAmount,
      oldestCredit.getSourceYear(),
      `Credit received from ${fromShipId}`
    );
    
    // Save both entries
    await this.bankEntryRepository.create(transferEntry);
    await this.bankEntryRepository.create(depositEntry);
    
    return transferEntry;
  }

  async processExpiredCredits(): Promise<number> {
    return await this.bankEntryRepository.processExpiredCredits();
  }

  async getBankingStatistics(shipId: string): Promise<{
    totalDeposits: number;
    totalWithdrawals: number;
    currentBalance: number;
    expiringSoon: number;
    utilizationRate: number;
  }> {
    if (!shipId || shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    return await this.bankEntryRepository.getBankingStatistics(shipId);
  }

  async getExpiringSoonCredits(shipId: string, withinDays: number = 365): Promise<BankEntry[]> {
    if (!shipId || shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    
    const currentYear = new Date().getFullYear();
    const activeCredits = await this.bankEntryRepository.findActiveCredits(shipId);
    
    return activeCredits.filter(credit => {
      const yearsUntilExpiry = credit.getExpiryYear() - currentYear;
      const daysUntilExpiry = yearsUntilExpiry * 365;
      return daysUntilExpiry <= withinDays && daysUntilExpiry > 0;
    });
  }

  private validateBankEntryData(entryData: BankEntryData): void {
    if (!entryData.shipId || entryData.shipId.trim().length === 0) {
      throw new Error('Ship ID is required');
    }
    
    if (entryData.creditAmount <= 0) {
      throw new Error('Credit amount must be greater than 0');
    }
    
    if (entryData.sourceYear < 2025 || entryData.sourceYear > 2050) {
      throw new Error('Source year must be between 2025 and 2050');
    }
    
    if (!entryData.transactionDate) {
      throw new Error('Transaction date is required');
    }
    
    if (!['deposit', 'withdrawal', 'transfer'].includes(entryData.transactionType)) {
      throw new Error('Invalid transaction type');
    }
    
    if (!['active', 'expired', 'used'].includes(entryData.status)) {
      throw new Error('Invalid status');
    }
    
    if (entryData.transactionType === 'transfer' && !entryData.transferToShipId) {
      throw new Error('Transfer transactions require target ship ID');
    }
  }
}
