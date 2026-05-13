<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { VCard, VButton, VBadge } from '../components/ui'
import FileUpload from 'primevue/fileupload'
import { api } from '../lib/axios'

const isUploading = ref(false)
const uploadError = ref('')
const serverPreviewUrl = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const activePreviewUrl = computed(() => serverPreviewUrl.value || previewUrl.value)
const uploadEdital = async () => {
  if (!selectedFile.value) return

  try {
    isUploading.value = true
    uploadError.value = ''

    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const { data } = await api.post('/editais', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const preview = await api.get(`/editais/${data.id}/file`)
    serverPreviewUrl.value = preview.data.url
  } catch (err: any) {
    uploadError.value = err?.response?.data?.message || 'Falha no upload.'
  } finally {
    isUploading.value = false
  }
}
const hasFile = computed(() => Boolean(selectedFile.value))

const formatSize = (value?: number) => {
  if (!value) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const resetPreview = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  serverPreviewUrl.value = ''
  previewUrl.value = ''
  selectedFile.value = null
}

const onFileSelect = (event: any) => {
  const file = event.files?.[0]
  if (!file) return
  resetPreview()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

const onFileClear = () => {
  resetPreview()
}

onBeforeUnmount(() => resetPreview())
</script>

<template>
  <div class="edital-view">
    <header class="view-header">
      <div>
        <h1 class="text-4xl font-serif font-bold text-on-surface">Edital</h1>
        <p class="text-secondary mt-2">Envie o PDF e visualize com seguranca antes de publicar.</p>
      </div>
    </header>

    <div class="viewer-grid">
      <aside class="viewer-sidebar">
        <VCard class="sidebar-card">
          <div class="section-head">
            <div>
              <h2 class="section-title">Edital</h2>
              <p class="section-subtitle">Somente PDF, tamanho maximo 10 MB.</p>
            </div>
            <div class="section-tags">
              <VBadge variant="secondary">PDF</VBadge>
              <VBadge variant="primary">Privado</VBadge>
            </div>
          </div>

          <div class="upload-drop">
            <FileUpload
              mode="advanced"
              name="file"
              accept="application/pdf"
              :maxFileSize="10 * 1024 * 1024"
              :customUpload="true"
              :showUploadButton="false"
              :showCancelButton="false"
              chooseLabel="Selecionar PDF"
              @select="onFileSelect"
              @clear="onFileClear"
              @remove="onFileClear"
            />
            <div class="upload-hint">
              <span class="material-symbols-outlined">upload_file</span>
              <span>Arraste o PDF ou clique para selecionar.</span>
            </div>
          </div>

          <div class="rule-list">
            <div class="rule-item"><strong>Formato:</strong> PDF unico</div>
            <div class="rule-item"><strong>Privacidade:</strong> visivel apenas para voce</div>
            <div class="rule-item"><strong>Limite:</strong> 10 MB</div>
          </div>

          <div v-if="selectedFile" class="file-summary">
            <div class="file-summary-icon">
              <span class="material-symbols-outlined">picture_as_pdf</span>
            </div>
            <div class="file-summary-meta">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
            </div>
          </div>
          <div v-else class="file-placeholder">
            Nenhum arquivo selecionado.
          </div>

          <div class="file-actions">
            <VButton variant="secondary" @click="onFileClear" :disabled="!selectedFile">
              Remover arquivo
            </VButton>
            <VButton
              variant="primary"
              :disabled="!selectedFile || isUploading"
              @click="uploadEdital"
            >
              {{ isUploading ? 'Enviando...' : 'Enviar e visualizar' }}
            </VButton>
            <a v-if="activePreviewUrl" :href="activePreviewUrl" target="_blank" rel="noreferrer" class="file-link">
              Abrir em nova guia
            </a>
          </div>

          <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>

          <div class="help-block">
            <p class="help-title">Guia rapido</p>
            <div class="help-step" :class="{ 'help-step--done': hasFile }">
              <span class="material-symbols-outlined">
                {{ hasFile ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <div>
                <p class="help-step-title">1. Selecione o PDF</p>
                <p class="help-step-desc">Arraste o arquivo ou clique em Selecionar PDF.</p>
              </div>
            </div>
            <div class="help-step" :class="{ 'help-step--done': activePreviewUrl }">
              <span class="material-symbols-outlined">
                {{ activePreviewUrl ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <div>
                <p class="help-step-title">2. Confira o preview</p>
                <p class="help-step-desc">Verifique se o edital esta completo e legivel.</p>
              </div>
            </div>
            <div class="help-step">
              <span class="material-symbols-outlined">info</span>
              <div>
                <p class="help-step-title">3. Troque se precisar</p>
                <p class="help-step-desc">Use Remover arquivo para substituir o PDF.</p>
              </div>
            </div>
          </div>
        </VCard>
      </aside>

      <VCard class="viewer-card">
        <div class="section-head">
          <div>
            <h2 class="section-title">Visualizacao</h2>
            <p class="section-subtitle">Confira o conteudo antes de salvar.</p>
          </div>
          <VBadge variant="secondary">Somente leitura</VBadge>
        </div>

        <div class="preview-body">
          <iframe v-if="activePreviewUrl" class="pdf-preview" :src="activePreviewUrl" title="Preview do edital"></iframe>
          <p v-if="activePreviewUrl" class="preview-tip">Dica: use o scroll do mouse para navegar entre as paginas.</p>
          <div v-else class="preview-empty">
            <span class="material-symbols-outlined">description</span>
            <p>Nenhum PDF selecionado ainda.</p>
            <span class="text-secondary text-sm">O preview aparece apos selecionar um arquivo.</span>
          </div>
        </div>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.edital-view {
  width: 100%;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.viewer-grid {
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.viewer-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-card,
.viewer-card {
  padding: 1.5rem;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-title {
  font-family: var(--ds-font-serif);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--on-surface);
}

.section-subtitle {
  margin-top: 0.35rem;
  color: var(--secondary);
  font-size: 0.9rem;
}

.section-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.upload-drop {
  display: grid;
  gap: 0.75rem;
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--secondary);
  font-size: 0.85rem;
}

.rule-list {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--surface-container-low);
  border: 1px solid var(--outline-variant);
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--secondary);
}

.rule-item strong {
  color: var(--on-surface);
  font-weight: 600;
}

.file-summary {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.file-summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  background: var(--primary-container);
  color: var(--on-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-summary-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.file-name {
  font-weight: 600;
  color: var(--on-surface);
}

.file-size {
  font-size: 0.75rem;
  color: var(--secondary);
}

.file-placeholder {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px dashed var(--outline-variant);
  color: var(--secondary);
  font-size: 0.85rem;
}

.file-actions {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.file-link {
  color: var(--primary);
  font-size: 0.85rem;
  text-decoration: none;
}

.file-link:hover {
  text-decoration: underline;
}

.upload-error {
  margin-top: 0.75rem;
  color: var(--error);
  font-size: 0.85rem;
}

.help-block {
  margin-top: 1rem;
  padding: 0.85rem;
  border-radius: 0.75rem;
  background: var(--surface-container-low);
  border: 1px solid var(--outline-variant);
  display: grid;
  gap: 0.75rem;
}

.help-title {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  color: var(--secondary);
  font-weight: 700;
}

.help-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.6rem;
  align-items: start;
  color: var(--secondary);
}

.help-step .material-symbols-outlined {
  font-size: 1.25rem;
  color: var(--outline-variant);
}

.help-step--done .material-symbols-outlined {
  color: var(--success);
  font-variation-settings: 'FILL' 1;
}

.help-step-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--on-surface);
}

.help-step-desc {
  font-size: 0.8rem;
  color: var(--secondary);
}

.preview-body {
  display: grid;
  gap: 0.75rem;
}

.preview-tip {
  font-size: 0.8rem;
  color: var(--secondary);
}

.pdf-preview {
  width: 100%;
  height: 560px;
  border: 1px solid var(--outline-variant);
  border-radius: 0.75rem;
  background: var(--surface-container-lowest);
}

.preview-empty {
  padding: 2.5rem;
  border-radius: 0.75rem;
  border: 1px dashed var(--outline-variant);
  color: var(--secondary);
  text-align: center;
  display: grid;
  gap: 0.35rem;
  place-items: center;
}

.preview-empty .material-symbols-outlined {
  font-size: 2.5rem;
  color: var(--outline-variant);
}

:deep(.p-fileupload) {
  border: 1px dashed var(--outline-variant);
  border-radius: 0.75rem;
  background: var(--surface-container-lowest);
}

:deep(.p-fileupload-header) {
  background: var(--surface-container-low);
  border-bottom: 1px solid var(--outline-variant);
  border-radius: 0.75rem 0.75rem 0 0;
}

:deep(.p-fileupload-content) {
  padding: 1.25rem;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.p-fileupload-file-name) {
  font-weight: 600;
}

@media (max-width: 1100px) {
  .viewer-grid {
    grid-template-columns: 1fr;
  }
}
</style>