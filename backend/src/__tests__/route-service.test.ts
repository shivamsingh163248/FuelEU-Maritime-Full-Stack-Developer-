import { RouteService } from '../core/application/route-service';
import { RouteRepository } from '../core/ports/route-repository';
import { Route, VesselType, FuelType } from '../core/domain/route';
import { FuelEUError, ERROR_CODES } from '../shared/constants';

// Mock repository
const mockRouteRepository: jest.Mocked<RouteRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByRouteId: jest.fn(),
  findBaseline: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  setBaseline: jest.fn(),
  delete: jest.fn(),
};

describe('RouteService', () => {
  let routeService: RouteService;

  beforeEach(() => {
    jest.clearAllMocks();
    routeService = new RouteService(mockRouteRepository);
  });

  const mockRoute: Route = {
    id: 'test-id',
    routeId: 'R001',
    vesselType: 'Container' as VesselType,
    fuelType: 'HFO' as FuelType,
    year: 2024,
    ghgIntensity: 91.0,
    fuelConsumption: 5000,
    distance: 12000,
    totalEmissions: 4500,
    isBaseline: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAllRoutes', () => {
    it('should return all routes', async () => {
      mockRouteRepository.findAll.mockResolvedValue([mockRoute]);

      const result = await routeService.getAllRoutes();

      expect(result).toEqual([mockRoute]);
      expect(mockRouteRepository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should apply filters when provided', async () => {
      const filters = { vesselType: 'Container' as VesselType, year: 2024 };
      mockRouteRepository.findAll.mockResolvedValue([mockRoute]);

      const result = await routeService.getAllRoutes(filters);

      expect(result).toEqual([mockRoute]);
      expect(mockRouteRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('getRouteById', () => {
    it('should return route when found', async () => {
      mockRouteRepository.findById.mockResolvedValue(mockRoute);

      const result = await routeService.getRouteById('test-id');

      expect(result).toEqual(mockRoute);
      expect(mockRouteRepository.findById).toHaveBeenCalledWith('test-id');
    });

    it('should throw error when route not found', async () => {
      mockRouteRepository.findById.mockResolvedValue(null);

      await expect(routeService.getRouteById('non-existent')).rejects.toThrow(
        new FuelEUError('Route not found', ERROR_CODES.ROUTE_NOT_FOUND, 404)
      );
    });
  });

  describe('setBaseline', () => {
    it('should set baseline for existing route', async () => {
      const baselineRoute = { ...mockRoute, isBaseline: true };
      mockRouteRepository.findById.mockResolvedValue(mockRoute);
      mockRouteRepository.setBaseline.mockResolvedValue(baselineRoute);

      const result = await routeService.setBaseline('test-id');

      expect(result).toEqual(baselineRoute);
      expect(mockRouteRepository.setBaseline).toHaveBeenCalledWith('test-id');
    });

    it('should throw error when route not found for baseline', async () => {
      mockRouteRepository.findById.mockResolvedValue(null);

      await expect(routeService.setBaseline('non-existent')).rejects.toThrow(
        new FuelEUError('Route not found', ERROR_CODES.ROUTE_NOT_FOUND, 404)
      );
    });
  });

  describe('getComparison', () => {
    it('should return comparison data when baseline exists', async () => {
      const baselineRoute = { ...mockRoute, isBaseline: true };
      const comparisonRoute = { 
        ...mockRoute, 
        id: 'test-id-2', 
        routeId: 'R002', 
        ghgIntensity: 88.0,
        isBaseline: false 
      };
      
      mockRouteRepository.findBaseline.mockResolvedValue(baselineRoute);
      mockRouteRepository.findAll.mockResolvedValue([baselineRoute, comparisonRoute]);

      const result = await routeService.getComparison();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        baseline: baselineRoute,
        comparison: comparisonRoute,
        compliant: true, // 88.0 <= 89.3368
        targetIntensity: 89.3368,
      });
      expect(result[0].percentDiff).toBeCloseTo(-3.3, 1); // (88.0/91.0 - 1) * 100
    });

    it('should throw error when no baseline is set', async () => {
      mockRouteRepository.findBaseline.mockResolvedValue(null);

      await expect(routeService.getComparison()).rejects.toThrow(
        new FuelEUError('No baseline route set', ERROR_CODES.BASELINE_NOT_SET, 400)
      );
    });
  });
});
