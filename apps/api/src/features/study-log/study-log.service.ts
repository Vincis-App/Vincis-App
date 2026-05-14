import { prisma } from '../../lib/prisma.js';
import { CreateStudyLogInput } from './study-log.schema.js';

export const studyLogService = {
  // Salva um novo log no banco
  async create(data: CreateStudyLogInput) {
    return prisma.studyLog.create({
      data: data
    });
  },

  // Busca todos os logs de uma matéria específica
  async getByDiscipline(disciplineId: number) {
    return prisma.studyLog.findMany({
      where: { disciplineId },
      orderBy: { date: 'desc' }, // Mais recentes primeiro
    });
  }
};
