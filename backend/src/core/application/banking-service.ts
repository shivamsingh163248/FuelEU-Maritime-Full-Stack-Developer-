import { BankEntry, CreateBankEntryDto, BankTransactionType } from '../domain/compliance';
import { BankRepository, ComplianceRepository } from '../ports/compliance-repository';
import { FUEL_EU_CONSTANTS, FuelEUError, ERROR_CODES } from '../../shared/constants';
import { validatePositiveNumber } from '../../shared/utils';

export class BankingService {
  constructor(
    private bankRepository: BankRepository,
    private complianceRepository: ComplianceRepository
  ) {}

  async getBankEntries(shipId: string, year?: number): Promise<BankEntry[]> {
    return this.bankRepository.findBankEntries(shipId, year);
  }

  /**
   * Bank positive Compliance Balance (Article 20)
   * Only positive CB can be banked, max 20%
   */
  async bankSurplus(shipId: string, year: number, amount: number): Promise<BankEntry> {
    validatePositiveNumber(amount, 'Amount');

    // Check if ship has positive CB
    const cb = await this.complianceRepository.findComplianceBalance(shipId, year);
    if (!cb || cb.cbGco2eq <= 0) {
      throw new FuelEUError(
        'Cannot bank negative or zero compliance balance',
        ERROR_CODES.INVALID_CB_AMOUNT,
        400
      );
    }

    // Check if amount exceeds maximum bankable amount (20% of positive CB)
    const maxBankable = cb.cbGco2eq * FUEL_EU_CONSTANTS.BANKING.MAX_BANK_PERCENTAGE;
    if (amount > maxBankable) {
      throw new FuelEUError(
        `Amount exceeds maximum bankable amount (${maxBankable} gCO₂e)`,
        ERROR_CODES.INVALID_CB_AMOUNT,
        400
      );
    }

    const bankEntryDto: CreateBankEntryDto = {
      shipId,
      year,
      amountGco2eq: amount,
      transactionType: BankTransactionType.BANK,
      description: `Banked ${amount} gCO₂e from year ${year}`,
    };

    return this.bankRepository.createBankEntry(bankEntryDto);
  }

  /**
   * Apply banked surplus to cover deficit
   */
  async applyBankedSurplus(shipId: string, year: number, amount: number): Promise<BankEntry> {
    validatePositiveNumber(amount, 'Amount');

    // Check available banked amount
    const availableBanked = await this.bankRepository.getAvailableBankedAmount(shipId, year);
    if (amount > availableBanked) {
      throw new FuelEUError(
        `Insufficient banked amount. Available: ${availableBanked} gCO₂e`,
        ERROR_CODES.INSUFFICIENT_BANKED_AMOUNT,
        400
      );
    }

    // Check if ship has deficit to cover
    const cb = await this.complianceRepository.findComplianceBalance(shipId, year);
    if (!cb || cb.cbGco2eq >= 0) {
      throw new FuelEUError(
        'Cannot apply banked amount to positive or zero compliance balance',
        ERROR_CODES.INVALID_CB_AMOUNT,
        400
      );
    }

    const bankEntryDto: CreateBankEntryDto = {
      shipId,
      year,
      amountGco2eq: -amount, // Negative because it's being applied
      transactionType: BankTransactionType.APPLY,
      description: `Applied ${amount} gCO₂e to cover deficit in year ${year}`,
    };

    return this.bankRepository.createBankEntry(bankEntryDto);
  }

  async getTotalBankedAmount(shipId: string): Promise<number> {
    return this.bankRepository.getTotalBankedAmount(shipId);
  }

  async getAvailableBankedAmount(shipId: string, year: number): Promise<number> {
    return this.bankRepository.getAvailableBankedAmount(shipId, year);
  }
}
