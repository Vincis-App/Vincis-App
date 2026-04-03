<script setup lang="ts">
defineProps<{
  label?: string;
  modelValue: string | number;
  options: { label: string; value: any }[];
}>();
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" class="text-[11px] uppercase tracking-wider font-bold text-secondary ml-1">{{ label }}</label>
    <div class="relative">
      <select 
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        class="w-full px-4 py-3 rounded-xl bg-white border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none appearance-none transition-all font-body cursor-pointer"
      >
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
        expand_more
      </span>
    </div>
  </div>
</template>