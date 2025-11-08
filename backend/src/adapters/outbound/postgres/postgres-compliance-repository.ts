import { 
  ComplianceBalance, 
  BankEntry, 
  Pool, 
  PoolMember, 
  CreateBankEntryDto, 
  CreatePoolDto,
  BankTransactionType
} from '../../../core/domain/compliance';
import { ComplianceRepository, BankRepository, PoolRepository } from '../../../core/ports/compliance-repository';
import { Database } from '../../../infrastructure/db/database';
import { generateId } from '../../../shared/utils';

export class PostgresComplianceRepository implements ComplianceRepository {
  constructor(private database: Database) {}

  async findComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance | null> {
    const result = await this.database.query(
      'SELECT * FROM ship_compliance WHERE ship_id = $1 AND year = $2',
      [shipId, year]
    );
    return result.rows.length > 0 ? this.mapRowToComplianceBalance(result.rows[0]) : null;
  }

  async createComplianceBalance(cb: Omit<ComplianceBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceBalance> {
    const id = generateId();
    const now = new Date();
    
    const result = await this.database.query(`
      INSERT INTO ship_compliance (id, ship_id, year, cb_gco2eq, energy_in_scope, 
                                  actual_intensity, target_intensity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [id, cb.shipId, cb.year, cb.cbGco2eq, cb.energyInScope, cb.actualIntensity, cb.targetIntensity, now, now]);

    return this.mapRowToComplianceBalance(result.rows[0]);
  }

  async updateComplianceBalance(id: string, updates: Partial<ComplianceBalance>): Promise<ComplianceBalance> {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && value !== undefined) {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    fields.push(`updated_at = $${paramIndex}`);
    params.push(new Date());
    params.push(id);

    const query = `UPDATE ship_compliance SET ${fields.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`;
    const result = await this.database.query(query, params);

    if (result.rows.length === 0) {
      throw new Error('Compliance balance not found');
    }

    return this.mapRowToComplianceBalance(result.rows[0]);
  }

  private mapRowToComplianceBalance(row: any): ComplianceBalance {
    return {
      id: row.id,
      shipId: row.ship_id,
      year: row.year,
      cbGco2eq: parseFloat(row.cb_gco2eq),
      energyInScope: parseFloat(row.energy_in_scope),
      actualIntensity: parseFloat(row.actual_intensity),
      targetIntensity: parseFloat(row.target_intensity),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export class PostgresBankRepository implements BankRepository {
  constructor(private database: Database) {}

  async findBankEntries(shipId: string, year?: number): Promise<BankEntry[]> {
    let query = 'SELECT * FROM bank_entries WHERE ship_id = $1';
    const params = [shipId];

    if (year) {
      query += ' AND year = $2';
      params.push(year.toString());
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.database.query(query, params);
    return result.rows.map(this.mapRowToBankEntry);
  }

  async createBankEntry(entry: CreateBankEntryDto): Promise<BankEntry> {
    const id = generateId();
    const now = new Date();
    
    const result = await this.database.query(`
      INSERT INTO bank_entries (id, ship_id, year, amount_gco2eq, transaction_type, description, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, entry.shipId, entry.year, entry.amountGco2eq, entry.transactionType, entry.description, now]);

    return this.mapRowToBankEntry(result.rows[0]);
  }

  async getTotalBankedAmount(shipId: string): Promise<number> {
    const result = await this.database.query(
      'SELECT COALESCE(SUM(amount_gco2eq), 0) as total FROM bank_entries WHERE ship_id = $1',
      [shipId]
    );
    return parseFloat(result.rows[0].total);
  }

  async getAvailableBankedAmount(shipId: string, _year: number): Promise<number> {
    // For simplicity, we'll return total banked amount
    // In real implementation, would consider banking rules and expiry
    const result = await this.database.query(
      'SELECT COALESCE(SUM(amount_gco2eq), 0) as total FROM bank_entries WHERE ship_id = $1 AND amount_gco2eq > 0',
      [shipId]
    );
    return parseFloat(result.rows[0].total);
  }

  private mapRowToBankEntry(row: any): BankEntry {
    return {
      id: row.id,
      shipId: row.ship_id,
      year: row.year,
      amountGco2eq: parseFloat(row.amount_gco2eq),
      transactionType: row.transaction_type as BankTransactionType,
      description: row.description,
      createdAt: row.created_at,
    };
  }
}

export class PostgresPoolRepository implements PoolRepository {
  constructor(private database: Database) {}

  async createPool(pool: CreatePoolDto): Promise<Pool> {
    const id = generateId();
    const now = new Date();
    
    const result = await this.database.query(`
      INSERT INTO pools (id, year, created_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id, pool.year, now]);

    return {
      id: result.rows[0].id,
      year: result.rows[0].year,
      createdAt: result.rows[0].created_at,
    };
  }

  async findPoolById(id: string): Promise<Pool | null> {
    const result = await this.database.query('SELECT * FROM pools WHERE id = $1', [id]);
    return result.rows.length > 0 ? {
      id: result.rows[0].id,
      year: result.rows[0].year,
      createdAt: result.rows[0].created_at,
    } : null;
  }

  async findPoolMembers(poolId: string): Promise<PoolMember[]> {
    const result = await this.database.query(
      'SELECT * FROM pool_members WHERE pool_id = $1',
      [poolId]
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      poolId: row.pool_id,
      shipId: row.ship_id,
      cbBefore: parseFloat(row.cb_before),
      cbAfter: parseFloat(row.cb_after),
    }));
  }

  async addPoolMember(poolId: string, member: Omit<PoolMember, 'id' | 'poolId'>): Promise<PoolMember> {
    const id = generateId();
    
    const result = await this.database.query(`
      INSERT INTO pool_members (id, pool_id, ship_id, cb_before, cb_after)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, poolId, member.shipId, member.cbBefore, member.cbAfter]);

    return {
      id: result.rows[0].id,
      poolId: result.rows[0].pool_id,
      shipId: result.rows[0].ship_id,
      cbBefore: parseFloat(result.rows[0].cb_before),
      cbAfter: parseFloat(result.rows[0].cb_after),
    };
  }
}
