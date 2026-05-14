import { Router } from 'express';
import { errorLogController } from './error-log.controller.js';

const router = Router();

// Rota para criar um log: POST /error-logs
router.post('/', errorLogController.create);

// Rota para listar logs de uma disciplina: GET /error-logs/discipline/123
router.get('/discipline/:disciplineId', errorLogController.list);

export { router as errorLogRouter };
