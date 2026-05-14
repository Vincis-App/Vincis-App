import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { api } from '../lib/axios' 
export function useStudyLogs(disciplineId?: number) {
  const queryClient = useQueryClient();

  // Hook para buscar a lista de logs
  const studyLogsQuery = useQuery({
    queryKey: ['study-logs', disciplineId],
    queryFn: async () => {
      const { data } = await api.get(`/study-logs/discipline/${disciplineId}`);
      return data;
    },
    enabled: !!disciplineId, // Só busca se o ID existir
  });

  // Hook para salvar um novo log
  const createStudyLogMutation = useMutation({
    mutationFn: async (newLog: any) => {
      const { data } = await api.post('/study-logs', newLog);
      return data;
    },
    onSuccess: () => {
      // Quando salva com sucesso, avisa o Vue Query para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ['study-logs'] });
    }
  });

  return { studyLogsQuery, createStudyLogMutation };
}
