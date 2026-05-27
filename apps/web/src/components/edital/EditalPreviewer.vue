<script setup lang="ts">
import { VCard, VBadge } from '../ui'

defineProps<{
  activePreviewUrl: string
}>()
</script>

<template>
  <VCard class="p-6">
    <div class="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 class="font-serif font-bold text-lg text-on-surface">Visualização</h2>
        <p class="mt-1 text-on-surface-muted text-[13px] leading-relaxed">Confira o conteúdo antes de salvar.</p>
      </div>
      <VBadge variant="secondary">Somente leitura</VBadge>
    </div>

    <div class="grid gap-3">
      <iframe 
        v-if="activePreviewUrl" 
        class="w-full h-[600px] border border-outline-variant/50 rounded-xl bg-surface-container-lowest" 
        :src="activePreviewUrl" 
        title="Preview do edital"
      ></iframe>
      <p v-if="activePreviewUrl" class="text-xs text-on-surface-muted">
        Dica: use o scroll do mouse para navegar entre as páginas.
      </p>
      
      <div v-else class="p-10 rounded-xl border border-dashed border-outline-variant/50 text-on-surface-muted text-center grid gap-1.5 place-items-center">
        <span class="material-symbols-outlined text-4xl text-outline-variant">description</span>
        <p class="font-bold text-on-surface">Nenhum PDF selecionado ainda.</p>
        <span class="text-on-surface-muted text-xs">O preview aparece após selecionar um arquivo.</span>
      </div>
    </div>
  </VCard>
</template>
