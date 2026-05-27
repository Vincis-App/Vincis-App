<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { RouterView } from 'vue-router'

const error = ref<any>(null)
onErrorCaptured((err) => {
  error.value = err
  console.error('Captured global error:', err)
  return false
})

const reloadPage = () => {
  window.location.reload()
}
</script>

<template>
  <div v-if="error" class="p-8 max-w-md mx-auto mt-16 bg-surface-container border border-outline-variant/30 rounded-2xl shadow-xl text-center flex flex-col items-center gap-4">
    <div class="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
      <span class="material-symbols-outlined">warning</span>
    </div>
    <h1 class="text-lg font-bold text-on-surface font-serif">Erro de Renderização</h1>
    <p class="text-xs text-on-surface-muted leading-relaxed">
      Houve uma falha na exibição da página. Tente recarregar ou retornar ao início.
    </p>
    <div class="flex gap-3 mt-2 w-full">
      <button @click="reloadPage" class="flex-1 text-xs font-bold py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 cursor-pointer transition">
        Recarregar
      </button>
      <button @click="error = null" class="flex-1 text-xs font-bold py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high cursor-pointer transition">
        Ignorar erro
      </button>
    </div>
  </div>
  <RouterView v-else />
</template>