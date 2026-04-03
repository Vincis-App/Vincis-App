<script setup lang="ts">
defineProps<{
  label?: string;
  modelValue: string | number;
  error?: string;
  placeholder?: string;
  type?: string;
}>();
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" class="text-[11px] uppercase tracking-wider font-bold text-secondary ml-1">{{ label }}</label>
    <input 
      :type="type || 'text'"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="placeholder"
      class="w-full px-4 py-3 rounded-xl bg-white border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body"
      :class="{ 'border-error focus:border-error focus:ring-error/10': error }"
    />
    <span v-if="error" class="text-[10px] text-error font-medium ml-1">{{ error }}</span>
  </div>
</template>