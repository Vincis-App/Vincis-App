<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { VCard, VButton, VBadge } from '../ui'

const props = defineProps<{
  selectedFile: File | null
  isUploading: boolean
  activePreviewUrl: string
  savedEdital: { id: number; title: string; fileName: string } | null
  isSavedEdital: boolean
}>()

const emit = defineEmits<{
  (e: 'fileSelect', event: any): void
  (e: 'fileClear'): void
  (e: 'upload'): void
  (e: 'rename', newTitle: string): void
}>()

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const isEditingName = ref(false)
const editNameValue = ref('')
const editNameInputRef = ref<HTMLInputElement | null>(null)

const hasFile = computed(() => Boolean(props.selectedFile))

const displayName = computed(() => {
  if (props.isSavedEdital && props.savedEdital) {
    return props.savedEdital.title
  }
  return props.selectedFile?.name || ''
})

const formatSize = (value?: number) => {
  if (!value) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    emit('fileSelect', { files })
  }
  target.value = ''
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    emit('fileSelect', { files })
  }
}

const startNameEdit = async () => {
  isEditingName.value = true
  editNameValue.value = props.savedEdital?.title || props.selectedFile?.name || ''
  await nextTick()
  editNameInputRef.value?.focus()
}

const cancelNameEdit = () => {
  isEditingName.value = false
  editNameValue.value = ''
}

const saveName = () => {
  if (editNameValue.value.trim()) {
    emit('rename', editNameValue.value.trim())
    isEditingName.value = false
  }
}

const handleClear = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emit('fileClear')
}
</script>

<template>
  <VCard class="p-6">
    <div class="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 class="font-serif font-bold text-lg text-on-surface">Edital</h2>
        <p class="mt-1 text-on-surface-muted text-[13px] leading-relaxed">Somente PDF, tamanho máximo 10 MB.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <VBadge variant="secondary">PDF</VBadge>
        <VBadge variant="primary">Privado</VBadge>
      </div>
    </div>

    <!-- Custom Drag and Drop Zone -->
    <div class="grid gap-3">
      <div 
        @dragover.prevent="isDragging = true"
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
        class="w-full min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 relative overflow-hidden select-none"
        :class="isDragging 
          ? 'border-primary bg-primary/5 dark:bg-primary-container/20 scale-[0.98] shadow-inner' 
          : 'border-outline-variant/50 bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-low/40'"
      >
        <input 
          type="file" 
          ref="fileInputRef" 
          class="hidden" 
          accept="application/pdf" 
          @change="handleFileChange"
        />
        
        <span class="material-symbols-outlined text-4xl text-primary/70 mb-2 transition-transform duration-300" :class="{ 'scale-110 text-primary': isDragging }">
          cloud_upload
        </span>
        
        <p class="text-xs font-bold text-on-surface">Arraste o PDF aqui ou clique para selecionar</p>
        <p class="text-[10px] text-on-surface-muted mt-1">Apenas PDF (máximo 10 MB)</p>
        
        <!-- Glow decoration when dragging -->
        <div v-if="isDragging" class="absolute inset-0 border border-primary/20 pointer-events-none rounded-2xl animate-pulse bg-gradient-to-tr from-primary/5 to-transparent"></div>
      </div>
    </div>

    <div class="mt-3 p-3 rounded-xl bg-surface-container-low dark:bg-surface-dark-elevated border border-outline-variant/30 grid gap-1.5 text-xs text-on-surface-muted">
      <div><strong>Formato:</strong> PDF único</div>
      <div><strong>Privacidade:</strong> visível apenas para você</div>
      <div><strong>Limite:</strong> 10 MB</div>
    </div>

    <!-- Selected File display with renaming support -->
    <div v-if="selectedFile" class="mt-3 p-3 rounded-xl bg-surface-container-low dark:bg-surface-dark-elevated border border-outline-variant/30 flex gap-3 items-center justify-between">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined">picture_as_pdf</span>
        </div>
        
        <!-- Inline Editing Form -->
        <div v-if="isEditingName" class="flex items-center gap-1.5 flex-1 min-w-0">
          <input 
            v-model="editNameValue" 
            type="text" 
            class="flex-1 text-xs px-2 py-1 rounded bg-surface-container-lowest border border-outline focus:outline-none focus:border-primary font-bold min-w-0 text-on-surface" 
            @keyup.enter="saveName"
            @keyup.esc="cancelNameEdit"
            ref="editNameInputRef"
          />
          <button @click="saveName" class="w-6 h-6 rounded-md hover:bg-success/15 text-success flex items-center justify-center cursor-pointer transition-colors" title="Salvar">
            <span class="material-symbols-outlined text-[16px]">check</span>
          </button>
          <button @click="cancelNameEdit" class="w-6 h-6 rounded-md hover:bg-error/15 text-error flex items-center justify-center cursor-pointer transition-colors" title="Cancelar">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        
        <!-- Regular display -->
        <div v-else class="flex flex-col gap-0.5 min-w-0 flex-1">
          <div class="flex items-center gap-1.5 group/title">
            <span class="font-bold text-sm text-on-surface truncate" :title="displayName">{{ displayName }}</span>
            <button 
              v-if="isSavedEdital" 
              @click="startNameEdit" 
              class="w-5 h-5 rounded hover:bg-primary-container/30 text-on-surface-muted hover:text-primary flex items-center justify-center cursor-pointer flex-shrink-0 transition-all opacity-0 group-hover/title:opacity-100"
              title="Editar nome do edital"
            >
              <span class="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
          <span class="text-[11px] text-on-surface-muted">{{ formatSize(selectedFile.size) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="mt-3 p-4 rounded-xl border border-dashed border-outline-variant/50 text-on-surface-muted text-sm text-center">
      Nenhum arquivo selecionado.
    </div>

    <div class="mt-4 flex flex-wrap gap-3 items-center">
      <VButton variant="secondary" @click="handleClear" :disabled="!selectedFile">
        Remover arquivo
      </VButton>
      <VButton
        variant="primary"
        :disabled="!selectedFile || isUploading"
        @click="$emit('upload')"
      >
        {{ isUploading ? 'Enviando...' : 'Enviar e visualizar' }}
      </VButton>
      <a v-if="activePreviewUrl" :href="activePreviewUrl" target="_blank" rel="noreferrer" class="text-primary text-xs hover:underline cursor-pointer">
        Abrir em nova guia
      </a>
    </div>
  </VCard>
</template>
