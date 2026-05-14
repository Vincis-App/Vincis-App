import { z } from 'zod';

// Aqui definimos o formato exato que a API espera receber do Front-End
export const createErrorLogSchema = z.object({
  disciplineId: z.number(), // ID da matéria (ex: Matemática)
  topicName: z.string(),    // Nome do assunto (ex: Álgebra)
  reason: z.enum(['Assunto não estudado', 'Atenção', 'Interpretação', 'Pegadinha', 'Tempo', 'Outro']),     // Motivo do erro
  description: z.string(),
  correction: z.string()
});

// Criamos um Tipo TypeScript baseado no Schema acima
export type CreateErrorLogInput = z.infer<typeof createErrorLogSchema>;
