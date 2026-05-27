import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'primevue/usetoast'
import { api } from '../lib/axios'
import { useStudyPlanStore } from '../stores/study-plan'

export function useEditalUpload() {
  const studyPlanStore = useStudyPlanStore()
  const queryClient = useQueryClient()
  const toast = useToast()

  const selectedFile = ref<File | null>(null)
  const previewUrl = ref('')
  const serverPreviewUrl = ref('')
  const uploadError = ref('')
  const errorKey = ref(0)

  const activePreviewUrl = computed(() => serverPreviewUrl.value || previewUrl.value)
  const activePlanId = computed(() => studyPlanStore.activePlanId)

  const resetPreview = () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    serverPreviewUrl.value = ''
    previewUrl.value = ''
    selectedFile.value = null
    uploadError.value = ''
    errorKey.value = 0
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const planId = activePlanId.value
      if (!planId) throw new Error('Nenhum plano de estudo ativo selecionado.')
      await api.delete(`/editais/${id}?studyPlanId=${planId}`)
    },
    onSuccess: () => {
      resetPreview()
      queryClient.invalidateQueries({ queryKey: ['active-edital'] })
    },
    onError: (err: any) => {
      uploadError.value = err?.response?.data?.message || err?.message || 'Falha ao excluir edital.'
    }
  })

  // Query to fetch the active edital for the study plan
  const activeEditalQuery = useQuery({
    queryKey: computed(() => ['active-edital', activePlanId.value]),
    queryFn: async () => {
      const planId = activePlanId.value
      if (!planId) return null
      const { data } = await api.get(`/editais?studyPlanId=${planId}`)
      return data
    },
    enabled: computed(() => !!activePlanId.value),
    refetchOnWindowFocus: false
  })

  // Watch query changes and load values
  watch(
    () => activeEditalQuery.data.value,
    (edital) => {
      if (edital) {
        serverPreviewUrl.value = edital.url
        // Construct a real browser File object representing the uploaded edital metadata
        const mockFile = new File([], edital.fileName, { type: edital.mimeType })
        Object.defineProperty(mockFile, 'size', {
          value: edital.fileSize,
          writable: false,
          configurable: true,
          enumerable: true
        })
        selectedFile.value = mockFile
      } else {
        // If no edital exists yet for this plan, reset state
        resetPreview()
      }
    },
    { immediate: true }
  )

  const onFileSelect = (event: any) => {
    const file = event.files?.[0]
    if (!file) return

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      const errMsg = 'O arquivo selecionado excede o limite de 10 MB.'
      uploadError.value = errMsg
      errorKey.value = Date.now()
      toast.add({
        severity: 'warn',
        summary: '⚠ Arquivo Excede o Limite de 10 MB',
        detail: 'O arquivo selecionado não pode ser enviado. Escolha um PDF com no máximo 10 MB.',
        life: 8000
      })
      return
    }

    resetPreview()
    uploadError.value = ''
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }

  const clearError = () => {
    uploadError.value = ''
    errorKey.value = 0
  }

  const onFileClear = async () => {
    const edital = activeEditalQuery.data.value
    if (edital) {
      uploadError.value = ''
      await deleteMutation.mutateAsync(edital.id)
    } else {
      resetPreview()
    }
  }

  onBeforeUnmount(() => resetPreview())

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const planId = activePlanId.value
      if (!planId) {
        throw new Error('Nenhum plano de estudo ativo selecionado.')
      }

      const formData = new FormData()
      formData.append('file', file)

      // POST to /editais?studyPlanId=...
      const { data } = await api.post(`/editais?studyPlanId=${planId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // GET to /editais/:id/file?studyPlanId=...
      const preview = await api.get(`/editais/${data.id}/file?studyPlanId=${planId}`)
      return preview.data.url
    },
    onSuccess: (url) => {
      serverPreviewUrl.value = url
      // Invalidate the active edital query to refresh database state
      queryClient.invalidateQueries({ queryKey: ['active-edital'] })
    },
    onError: (err: any) => {
      uploadError.value = err?.response?.data?.message || err?.message || 'Falha no upload.'
    }
  })

  const uploadEdital = async () => {
    if (!selectedFile.value) return
    uploadError.value = ''
    await uploadMutation.mutateAsync(selectedFile.value)
  }

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const planId = activePlanId.value
      if (!planId) throw new Error('Nenhum plano de estudo ativo selecionado.')
      const { data } = await api.patch(`/editais/${id}?studyPlanId=${planId}`, { title })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-edital'] })
    },
    onError: (err: any) => {
      uploadError.value = err?.response?.data?.message || err?.message || 'Falha ao renomear.'
    }
  })

  const renameEdital = async (newTitle: string) => {
    const edital = activeEditalQuery.data.value
    if (!edital) return
    uploadError.value = ''
    await renameMutation.mutateAsync({ id: edital.id, title: newTitle })
  }

  return {
    selectedFile,
    previewUrl,
    serverPreviewUrl,
    activePreviewUrl,
    isUploading: computed(() => uploadMutation.isPending.value),
    uploadError,
    errorKey,
    onFileSelect,
    onFileClear,
    uploadEdital,
    hasActivePlan: computed(() => studyPlanStore.hasActivePlan),
    savedEdital: computed(() => activeEditalQuery.data.value),
    isSavedEdital: computed(() => !!activeEditalQuery.data.value),
    renameEdital,
    clearError,
  }
}
