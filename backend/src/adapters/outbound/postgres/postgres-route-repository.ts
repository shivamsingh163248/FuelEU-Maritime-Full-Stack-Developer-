import { Route, CreateRouteDto, VesselType, FuelType } from '../../../core/domain/route';
import { RouteRepository, RouteFilters } from '../../../core/ports/route-repository';
import { Database } from '../../../infrastructure/db/database';
import { generateId } from '../../../shared/utils';

export class PostgresRouteRepository implements RouteRepository {
  constructor(private database: Database) {}

  async findAll(filters?: RouteFilters): Promise<Route[]> {
    let query = 'SELECT * FROM routes WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.vesselType) {
      query += ` AND vessel_type = $${paramIndex}`;
      params.push(filters.vesselType);
      paramIndex++;
    }

    if (filters?.fuelType) {
      query += ` AND fuel_type = $${paramIndex}`;
      params.push(filters.fuelType);
      paramIndex++;
    }

    if (filters?.year) {
      query += ` AND year = $${paramIndex}`;
      params.push(filters.year);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.database.query(query, params);
    return result.rows.map(this.mapRowToRoute);
  }

  async findById(id: string): Promise<Route | null> {
    const result = await this.database.query('SELECT * FROM routes WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.mapRowToRoute(result.rows[0]) : null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    const result = await this.database.query('SELECT * FROM routes WHERE route_id = $1', [routeId]);
    return result.rows.length > 0 ? this.mapRowToRoute(result.rows[0]) : null;
  }

  async findBaseline(): Promise<Route | null> {
    const result = await this.database.query('SELECT * FROM routes WHERE is_baseline = TRUE LIMIT 1');
    return result.rows.length > 0 ? this.mapRowToRoute(result.rows[0]) : null;
  }

  async create(route: CreateRouteDto): Promise<Route> {
    const id = generateId();
    const now = new Date();
    
    const result = await this.database.query(`
      INSERT INTO routes (id, route_id, vessel_type, fuel_type, year, ghg_intensity, 
                         fuel_consumption, distance, total_emissions, is_baseline, 
                         created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      id, route.routeId, route.vesselType, route.fuelType, route.year,
      route.ghgIntensity, route.fuelConsumption, route.distance, route.totalEmissions,
      false, now, now
    ]);

    return this.mapRowToRoute(result.rows[0]);
  }

  async update(id: string, updates: Partial<Route>): Promise<Route> {
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

    const query = `UPDATE routes SET ${fields.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`;
    const result = await this.database.query(query, params);

    if (result.rows.length === 0) {
      throw new Error('Route not found');
    }

    return this.mapRowToRoute(result.rows[0]);
  }

  async setBaseline(id: string): Promise<Route> {
    // First, unset any existing baseline
    await this.database.query('UPDATE routes SET is_baseline = FALSE WHERE is_baseline = TRUE');
    
    // Then set the new baseline
    const result = await this.database.query(`
      UPDATE routes SET is_baseline = TRUE, updated_at = $1 WHERE id = $2 RETURNING *
    `, [new Date(), id]);

    if (result.rows.length === 0) {
      throw new Error('Route not found');
    }

    return this.mapRowToRoute(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.database.query('DELETE FROM routes WHERE id = $1', [id]);
  }

  private mapRowToRoute(row: any): Route {
    return {
      id: row.id,
      routeId: row.route_id,
      vesselType: row.vessel_type as VesselType,
      fuelType: row.fuel_type as FuelType,
      year: row.year,
      ghgIntensity: parseFloat(row.ghg_intensity),
      fuelConsumption: parseFloat(row.fuel_consumption),
      distance: parseFloat(row.distance),
      totalEmissions: parseFloat(row.total_emissions),
      isBaseline: row.is_baseline,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
