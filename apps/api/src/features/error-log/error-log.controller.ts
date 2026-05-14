import { Request, Response } from 'express';
import { errorLogService } from './error-log.service.js';
import { createErrorLogSchema } from './error-log.schema.js';

export const errorLogController = {
  async create(req: Request, res: Response) {
    try {
      // 1. Validamos se o que o usuário mandou está correto
      const validatedData = createErrorLogSchema.parse(req.body);
      
      // 2. Chamamos o serviço para salvar
      const log = await errorLogService.create(validatedData);
      
      // 3. Respondemos com Status 201 (Criado)
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  },

  async list(req: Request, res: Response) {
    const { disciplineId } = req.params;
    const logs = await errorLogService.getByDiscipline(Number(disciplineId));
    res.json(logs);
  }
};
