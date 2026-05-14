import { Request, Response } from 'express';
import { studyLogService } from './study-log.service.js';
import { createStudyLogSchema } from './study-log.schema.js';

export const studyLogController = {
  async create(req: Request, res: Response) {
    try {
      // 1. Validamos se o que o usuário mandou está correto
      const validatedData = createStudyLogSchema.parse(req.body);
      
      // 2. Chamamos o serviço para salvar
      const log = await studyLogService.create(validatedData);
      
      // 3. Respondemos com Status 201 (Criado)
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  },

  async list(req: Request, res: Response) {
    const { disciplineId } = req.params;
    const logs = await studyLogService.getByDiscipline(Number(disciplineId));
    res.json(logs);
  }
};
