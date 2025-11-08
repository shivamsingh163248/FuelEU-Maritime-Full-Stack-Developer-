export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number; // Compliance Balance in gCO₂e
  energyInScope: number; // MJ
  actualIntensity: number; // gCO₂e/MJ
  targetIntensity: number; // gCO₂e/MJ
  createdAt: Date;
  updatedAt: Date;
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number; // Amount banked in gCO₂e
  transactionType: BankTransactionType;
  description?: string;
  createdAt: Date;
}

export enum BankTransactionType {
  BANK = 'BANK',
  APPLY = 'APPLY',
}

export interface Pool {
  id: string;
  year: number;
  createdAt: Date;
}

export interface PoolMember {
  id: string;
  poolId: string;
  shipId: string;
  cbBefore: number; // CB before pooling in gCO₂e
  cbAfter: number; // CB after pooling in gCO₂e
}

export interface CreateBankEntryDto {
  shipId: string;
  year: number;
  amountGco2eq: number;
  transactionType: BankTransactionType;
  description?: string;
}

export interface CreatePoolDto {
  year: number;
  members: {
    shipId: string;
    cbBefore: number;
  }[];
}

export interface AdjustedComplianceBalance {
  shipId: string;
  year: number;
  originalCb: number;
  bankedAmount: number;
  adjustedCb: number;
}
