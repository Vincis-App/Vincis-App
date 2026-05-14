import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { api } from '../lib/axios'; // Seu cliente HTTP configurado

export function useErrorLogs(disciplineId?: number) {
  const queryClient = useQueryClient();

  // Hook para buscar a lista de logs
  const errorLogsQuery = useQuery({
    queryKey: ['error-logs', disciplineId],
    queryFn: async () => {
      const { data } = await api.get(`/error-logs/discipline/${disciplineId}`);
      return data;
    },
    enabled: !!disciplineId, // Só busca se o ID existir
  });

  // Hook para salvar um novo log
  const createErrorLogMutation = useMutation({
    mutationFn: async (newLog: any) => {
      const { data } = await api.post('/error-logs', newLog);
      return data;
    },
    onSuccess: () => {
      // Quando salva com sucesso, avisa o Vue Query para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    }
  });

  return { errorLogsQuery, createErrorLogMutation };
}
