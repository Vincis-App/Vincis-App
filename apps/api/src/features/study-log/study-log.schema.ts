import { z } from 'zod';

// Aqui definimos o formato exato que a API espera receber do Front-End
export const createStudyLogSchema = z.object({
  disciplineId: z.number(), // ID da matéria (ex: Matemática)
  topicName: z.string(),    // Nome do assunto (ex: Álgebra)
  
  // Transformamos a String que vem do JSON em um objeto Date do JS
  date: z.string().transform((str) => new Date(str)), 
  
  durationMinutes: z.number().min(1), // Mínimo 1 minuto estudado
  questionsCount: z.number().optional().default(0),
  correctCount: z.number().optional().default(0),
  notes: z.string().optional(),
});

// Criamos um Tipo TypeScript baseado no Schema acima
export type CreateStudyLogInput = z.infer<typeof createStudyLogSchema>;
