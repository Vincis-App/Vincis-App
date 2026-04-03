<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  loading?: boolean;
  disabled?: boolean;
}
withDefaults(defineProps<Props>(), { variant: 'primary' });
</script>

<template>
  <button 
    :disabled="disabled || loading"
    class="px-6 py-2.5 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="{
      'bg-primary text-on-primary hover:bg-primary/90 shadow-sm': variant === 'primary',
      'bg-primary-container text-on-primary-container hover:bg-primary-container/80': variant === 'secondary',
      'border border-outline-variant text-primary hover:bg-primary/5': variant === 'outline',
      'bg-error text-white hover:bg-error/90': variant === 'error',
      'text-secondary hover:bg-surface-variant/50': variant === 'ghost'
    }"
  >
    <span v-if="loading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
    <slot />
  </button>
</template>