<script setup lang="ts">
import Dialog from 'primevue/dialog'

defineProps<{
  visible?: boolean
  header?: string
  closable?: boolean
  modal?: boolean
}>()

defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

defineSlots<{
  default(props: {}): any
  footer(props: {}): any
  [key: string]: any
}>()
</script>

<template>
  <Dialog 
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="header"
    :closable="closable"
    :modal="modal"
    v-bind="$attrs"
  >
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>
  </Dialog>
</template>