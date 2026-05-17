<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { VCard, VButton } from '../components/ui'
import Avatar from 'primevue/avatar'
import InputText from 'primevue/inputtext'

const authStore = useAuthStore()

const isEditing = ref(false)
const isLoading = ref(false)

const editForm = reactive({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
  avatar: authStore.user?.avatar || ''
})

const fileInput = ref<HTMLInputElement | null>(null)

function startEditing() {
  editForm.name = authStore.user?.name || ''
  editForm.email = authStore.user?.email || ''
  editForm.avatar = authStore.user?.avatar || ''
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

function triggerFileInput() {
  if (isEditing.value && fileInput.value) {
    fileInput.value.click()
  }
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    editForm.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

async function saveProfile() {
  isLoading.value = true
  try {
    await authStore.updateProfile({
      name: editForm.name,
      email: editForm.email,
      avatar: editForm.avatar
    })
    isEditing.value = false
  } catch (error) {
    console.error('Erro ao salvar perfil', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="profile-view">
    <header class="view-header">
      <h1 class="text-4xl font-serif font-bold text-on-surface">Seu Perfil</h1>
      <p class="text-secondary mt-2">Gerencie suas informações pessoais e preferências.</p>
    </header>

    <div class="mt-8 max-w-2xl">
      <VCard class="p-8">
        <div class="flex items-center gap-6 mb-8">
          <div class="relative group" :class="{ 'cursor-pointer': isEditing }" @click="triggerFileInput">
            <Avatar 
              :image="isEditing ? editForm.avatar : authStore.user?.avatar" 
              size="xlarge" 
              shape="circle" 
              class="profile-avatar shadow-lg transition-opacity"
              :class="{ 'group-hover:opacity-80': isEditing }"
            />
            <div v-if="isEditing" class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="text-white text-xs font-bold">MUDAR</span>
            </div>
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden" 
              accept="image/*" 
              @change="onFileSelected" 
            />
          </div>
          <div>
            <h2 class="text-2xl font-serif font-bold text-on-surface">{{ authStore.user?.name }}</h2>
            <p class="text-secondary">{{ authStore.user?.email }}</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="profile-field flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-secondary">Nome Completo</label>
              <div v-if="!isEditing" class="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
                {{ authStore.user?.name }}
              </div>
              <InputText v-else v-model="editForm.name" placeholder="Seu nome" class="w-full" />
            </div>
            <div class="profile-field flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-secondary">Email</label>
              <div v-if="!isEditing" class="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
                {{ authStore.user?.email }}
              </div>
              <InputText v-else v-model="editForm.email" placeholder="Seu email" class="w-full" />
            </div>
          </div>
          
          <div class="pt-4 border-t border-outline-variant/20 flex justify-end gap-3">
            <template v-if="!isEditing">
              <VButton variant="primary" @click="startEditing">Editar Perfil</VButton>
            </template>
            <template v-else>
              <VButton variant="outline" @click="cancelEditing" :disabled="isLoading">Cancelar</VButton>
              <VButton variant="primary" @click="saveProfile" :disabled="isLoading">
                {{ isLoading ? 'Salvando...' : 'Salvar Alterações' }}
              </VButton>
            </template>
          </div>
        </div>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.view-header {
  margin-bottom: 2rem;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border: 4px solid var(--surface-container-lowest);
  object-fit: cover;
}
</style>
