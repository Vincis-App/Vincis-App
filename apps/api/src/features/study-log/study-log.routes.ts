import { Router } from 'express';
import { studyLogController } from './study-log.controller.js';

const router = Router();

// Rota para criar um log: POST /study-logs
router.post('/', studyLogController.create);

// Rota para listar logs de uma disciplina: GET /study-logs/discipline/123
router.get('/discipline/:disciplineId', studyLogController.list);

export { router as studyLogRouter };
