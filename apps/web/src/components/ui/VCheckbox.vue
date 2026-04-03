<script setup lang="ts">
defineProps<{
  label?: string;
  modelValue: boolean;
}>();
defineEmits(['update:modelValue']);
</script>

<template>
  <label class="flex items-center gap-3 cursor-pointer group">
    <div class="relative flex items-center">
      <input 
        type="checkbox" 
        :checked="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        class="peer appearance-none w-5 h-5 border-2 border-outline-variant rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer"
      />
      <span class="material-symbols-outlined absolute text-white text-[16px] scale-0 peer-checked:scale-100 transition-transform left-0.5 pointer-events-none">
        check
      </span>
    </div>
    <span v-if="label" class="text-sm font-medium text-on-surface group-hover:text-primary transition-colors italic font-serif">
      {{ label }}
    </span>
  </label>
</template>