export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number; // Compliance Balance in gCO₂e
  energyInScope: number; // MJ
  actualIntensity: number; // gCO₂e/MJ
  targetIntensity: number; // gCO₂e/MJ
  createdAt: string;
  updatedAt: string;
}

export interface AdjustedComplianceBalance {
  shipId: string;
  year: number;
  originalCb: number;
  bankedAmount: number;
  adjustedCb: number;
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number; // Amount banked in gCO₂e
  transactionType: BankTransactionType;
  description?: string;
  createdAt: string;
}

export type BankTransactionType = 'BANK' | 'APPLY';

export interface Pool {
  id: string;
  year: number;
  createdAt: string;
}

export interface PoolMember {
  id: string;
  poolId: string;
  shipId: string;
  cbBefore: number; // CB before pooling in gCO₂e
  cbAfter: number; // CB after pooling in gCO₂e
}

export interface CreatePoolRequest {
  year: number;
  members: {
    shipId: string;
    cbBefore: number;
  }[];
}

export interface PoolResult {
  pool: Pool;
  members: PoolMember[];
}
