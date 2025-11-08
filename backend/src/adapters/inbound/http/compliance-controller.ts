import { Request, Response } from 'express';
import { ComplianceService } from '../../../core/application/compliance-service';
import { BankingService } from '../../../core/application/banking-service';
import { PoolingService } from '../../../core/application/pooling-service';
import { FuelEUError } from '../../../shared/constants';

export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  async getComplianceBalance(req: Request, res: Response): Promise<void> {
    try {
      const { shipId, year } = req.query;
      
      if (!shipId || !year) {
        res.status(400).json({
          error: 'shipId and year are required',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const cb = await this.complianceService.getComplianceBalance(
        shipId as string, 
        parseInt(year as string)
      );
      res.json(cb);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getAdjustedComplianceBalance(req: Request, res: Response): Promise<void> {
    try {
      const { shipId, year } = req.query;
      
      if (!shipId || !year) {
        res.status(400).json({
          error: 'shipId and year are required',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const adjustedCb = await this.complianceService.getAdjustedComplianceBalance(
        shipId as string, 
        parseInt(year as string)
      );
      res.json(adjustedCb);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any): void {
    if (error instanceof FuelEUError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export class BankingController {
  constructor(private bankingService: BankingService) {}

  async getBankEntries(req: Request, res: Response): Promise<void> {
    try {
      const { shipId, year } = req.query;
      
      if (!shipId) {
        res.status(400).json({
          error: 'shipId is required',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const entries = await this.bankingService.getBankEntries(
        shipId as string, 
        year ? parseInt(year as string) : undefined
      );
      res.json(entries);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async bankSurplus(req: Request, res: Response): Promise<void> {
    try {
      const { shipId, year, amount } = req.body;
      
      if (!shipId || !year || !amount) {
        res.status(400).json({
          error: 'shipId, year, and amount are required',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const bankEntry = await this.bankingService.bankSurplus(shipId, year, amount);
      res.status(201).json(bankEntry);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async applyBankedSurplus(req: Request, res: Response): Promise<void> {
    try {
      const { shipId, year, amount } = req.body;
      
      if (!shipId || !year || !amount) {
        res.status(400).json({
          error: 'shipId, year, and amount are required',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const bankEntry = await this.bankingService.applyBankedSurplus(shipId, year, amount);
      res.status(201).json(bankEntry);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any): void {
    if (error instanceof FuelEUError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export class PoolingController {
  constructor(private poolingService: PoolingService) {}

  async createPool(req: Request, res: Response): Promise<void> {
    try {
      const { year, members } = req.body;
      
      if (!year || !members || !Array.isArray(members)) {
        res.status(400).json({
          error: 'year and members array are required',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const result = await this.poolingService.createPool({ year, members });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: any): void {
    if (error instanceof FuelEUError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}
