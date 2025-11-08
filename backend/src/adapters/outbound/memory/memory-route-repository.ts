import { Route, CreateRouteDto, VesselType, FuelType } from '../../../core/domain/route';
import { RouteRepository, RouteFilters } from '../../../core/ports/route-repository';
import { generateId } from '../../../shared/utils';

// In-memory database for demo purposes
export class MemoryRouteRepository implements RouteRepository {
  private routes: Route[] = [];

  constructor() {
    // Initialize with sample data
    this.seedData();
  }

  private seedData() {
    const sampleRoutes: CreateRouteDto[] = [
      {
        routeId: 'R001',
        vesselType: 'Container' as VesselType,
        fuelType: 'HFO' as FuelType,
        year: 2024,
        ghgIntensity: 91.0,
        fuelConsumption: 5000,
        distance: 12000,
        totalEmissions: 4500,
      },
      {
        routeId: 'R002',
        vesselType: 'BulkCarrier' as VesselType,
        fuelType: 'LNG' as FuelType,
        year: 2024,
        ghgIntensity: 88.0,
        fuelConsumption: 4800,
        distance: 11500,
        totalEmissions: 4200,
      },
      {
        routeId: 'R003',
        vesselType: 'Tanker' as VesselType,
        fuelType: 'MGO' as FuelType,
        year: 2024,
        ghgIntensity: 93.5,
        fuelConsumption: 5100,
        distance: 12500,
        totalEmissions: 4700,
      },
      {
        routeId: 'R004',
        vesselType: 'RoRo' as VesselType,
        fuelType: 'HFO' as FuelType,
        year: 2025,
        ghgIntensity: 89.2,
        fuelConsumption: 4900,
        distance: 11800,
        totalEmissions: 4300,
      },
      {
        routeId: 'R005',
        vesselType: 'Container' as VesselType,
        fuelType: 'LNG' as FuelType,
        year: 2025,
        ghgIntensity: 90.5,
        fuelConsumption: 4950,
        distance: 11900,
        totalEmissions: 4400,
      },
    ];

    sampleRoutes.forEach((routeData, index) => {
      this.routes.push({
        id: generateId(),
        ...routeData,
        isBaseline: index === 0, // Set first route as baseline
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  async findAll(filters?: RouteFilters): Promise<Route[]> {
    let filteredRoutes = [...this.routes];

    if (filters?.vesselType) {
      filteredRoutes = filteredRoutes.filter(r => r.vesselType === filters.vesselType);
    }

    if (filters?.fuelType) {
      filteredRoutes = filteredRoutes.filter(r => r.fuelType === filters.fuelType);
    }

    if (filters?.year) {
      filteredRoutes = filteredRoutes.filter(r => r.year === filters.year);
    }

    return filteredRoutes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findById(id: string): Promise<Route | null> {
    return this.routes.find(r => r.id === id) || null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    return this.routes.find(r => r.routeId === routeId) || null;
  }

  async findBaseline(): Promise<Route | null> {
    return this.routes.find(r => r.isBaseline) || null;
  }

  async create(route: CreateRouteDto): Promise<Route> {
    const newRoute: Route = {
      id: generateId(),
      ...route,
      isBaseline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.routes.push(newRoute);
    return newRoute;
  }

  async update(id: string, updates: Partial<Route>): Promise<Route> {
    const index = this.routes.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Route not found');
    }

    this.routes[index] = {
      ...this.routes[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.routes[index];
  }

  async setBaseline(id: string): Promise<Route> {
    // First, unset any existing baseline
    this.routes.forEach(r => {
      if (r.isBaseline) {
        r.isBaseline = false;
        r.updatedAt = new Date();
      }
    });

    // Then set the new baseline
    const route = this.routes.find(r => r.id === id);
    if (!route) {
      throw new Error('Route not found');
    }

    route.isBaseline = true;
    route.updatedAt = new Date();

    return route;
  }

  async delete(id: string): Promise<void> {
    const index = this.routes.findIndex(r => r.id === id);
    if (index !== -1) {
      this.routes.splice(index, 1);
    }
  }
}
