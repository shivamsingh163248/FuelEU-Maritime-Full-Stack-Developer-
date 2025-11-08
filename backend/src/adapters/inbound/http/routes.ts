import { Router } from 'express';
import { RouteController } from './route-controller';

export const createRouteRouter = (routeController: RouteController): Router => {
  const router = Router();

  router.get('/', (req, res) => routeController.getAllRoutes(req, res));
  router.get('/comparison', (req, res) => routeController.getComparison(req, res));
  router.get('/:id', (req, res) => routeController.getRouteById(req, res));
  router.post('/:id/baseline', (req, res) => routeController.setBaseline(req, res));

  return router;
};
