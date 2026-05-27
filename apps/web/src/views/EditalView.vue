<script setup lang="ts">
import { useEditalUpload } from '../hooks/useEditalUpload'
import EditalHeader from '../components/edital/EditalHeader.vue'
import EditalUploader from '../components/edital/EditalUploader.vue'
import EditalPreviewer from '../components/edital/EditalPreviewer.vue'

const {
  selectedFile,
  activePreviewUrl,
  isUploading,
  onFileSelect,
  onFileClear,
  uploadEdital,
  hasActivePlan,
  savedEdital,
  isSavedEdital,
  renameEdital,
} = useEditalUpload()
</script>

<template>
  <div class="w-full">
    <!-- Header -->
    <EditalHeader />

    <!-- No Active Study Plan State -->
    <div v-if="!hasActivePlan" class="p-8 text-center bg-surface-container-low dark:bg-surface-dark border-2 border-dashed border-outline-variant/30 rounded-xl">
      <span class="material-symbols-outlined text-5xl text-outline-variant mb-4">auto_stories</span>
      <p class="text-on-surface font-bold text-lg">Nenhum Plano de Estudo Ativo</p>
      <p class="text-on-surface-muted text-sm mt-1 max-w-sm mx-auto">Por favor, ative ou crie um plano de estudo na página de Planos de Estudo antes de prosseguir com o envio do edital.</p>
    </div>

    <!-- Viewer Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      <!-- Sidebar Upload Card -->
      <aside class="flex flex-col gap-4">
        <EditalUploader
          :selected-file="selectedFile"
          :is-uploading="isUploading"
          :active-preview-url="activePreviewUrl"
          :saved-edital="savedEdital"
          :is-saved-edital="isSavedEdital"
          @file-select="onFileSelect"
          @file-clear="onFileClear"
          @upload="uploadEdital"
          @rename="renameEdital"
        />
      </aside>

      <!-- Preview Card -->
      <EditalPreviewer
        :active-preview-url="activePreviewUrl"
      />
    </div>
  </div>
</template>