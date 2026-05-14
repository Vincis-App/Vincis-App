import { prisma } from '../../lib/prisma.js';
import { CreateErrorLogInput } from './error-log.schema.js';

export const errorLogService = {
  // Salva um novo log no banco
  async create(data: CreateErrorLogInput) {
    return prisma.errorLog.create({
      data: data
    });
  },

  // Busca todos os logs de uma matéria específica
  async getByDiscipline(disciplineId: number) {
    return prisma.errorLog.findMany({
      where: { disciplineId },
      orderBy: { createdAt: 'desc' }, // Mais recentes primeiro
    });
  }
};
