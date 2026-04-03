<script setup lang="ts">
defineProps<{
  title?: string;
  message: string;
  variant?: 'success' | 'error';
}>();
</script>

<template>
  <div 
    class="p-4 rounded-xl border flex gap-4 items-start shadow-sm"
    :class="{
      'bg-white border-success/30': variant === 'success',
      'bg-white border-error/30': variant === 'error'
    }"
  >
    <span 
      class="material-symbols-outlined"
      :class="variant === 'success' ? 'text-success' : 'text-error'"
    >
      {{ variant === 'success' ? 'check_circle' : 'error' }}
    </span>
    <div>
      <h4 v-if="title" class="font-bold text-sm leading-none mb-1">{{ title }}</h4>
      <p class="text-sm text-secondary">{{ message }}</p>
    </div>
  </div>
</template>