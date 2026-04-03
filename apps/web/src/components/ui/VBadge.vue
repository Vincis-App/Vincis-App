<script setup lang="ts">
defineProps<{
  variant?: 'success' | 'error' | 'warning' | 'info';
}>();
</script>

<template>
  <span 
    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border"
    :class="{
      'bg-success/10 text-success border-success/20': variant === 'success',
      'bg-error/10 text-error border-error/20': variant === 'error',
      'bg-primary-container/20 text-on-primary-container border-primary-container/30': !variant || variant === 'info'
    }"
  >
    <slot />
  </span>
</template>