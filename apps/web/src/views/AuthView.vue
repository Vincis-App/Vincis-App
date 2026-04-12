<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/axios'
import { VButton, VInput, VAlert, VCard } from '../components/ui'

const router = useRouter()
const isLoginMode = ref(true)
const email = ref('')
const password = ref('')
const message = ref('')
const isError = ref(false)
const isLoading = ref(false)

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  message.value = ''
  isError.value = false
}

const submitForm = async () => {
  isLoading.value = true
  message.value = ''
  isError.value = false

  const endpoint = isLoginMode.value ? '/auth/login' : '/auth/register'

  try {
    const res = await api.post(endpoint, {
      email: email.value,
      password: password.value
    })
    
    isError.value = false
    message.value = res.data.message || 'Sucesso!'

    if (isLoginMode.value) {
      setTimeout(() => router.push('/private'), 500)
    }
  } catch (error: any) {
    isError.value = true
    if (error.response?.data?.errors) {
      message.value = error.response.data.errors[0].message
    } else {
      message.value = error.response?.data?.message || 'Erro inesperado. Tente novamente.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background text-on-surface p-4">
    <div class="max-w-md w-full">
      <VCard class="p-8 shadow-xl bg-surface-container-lowest border-outline-variant/20">
        <h2 class="text-3xl font-serif font-bold text-center mb-8 text-on-surface">
          {{ isLoginMode ? 'Bem-vindo de volta!' : 'Crie sua conta' }}
        </h2>
        
        <form @submit.prevent="submitForm" class="space-y-6">
          <VInput 
            v-model="email" 
            label="E-mail"
            placeholder="seu@email.com"
            icon="mail"
            required 
          />
          
          <VInput 
            v-model="password" 
            label="Senha"
            type="password"
            placeholder="••••••••"
            icon="lock"
            required 
          />

          <!-- Alert/Message Box -->
          <div v-if="message" class="animate-fade-in">
            <VAlert 
              :variant="isError ? 'error' : 'success'" 
              :title="isError ? 'Ops!' : 'Tudo certo'" 
              :message="message" 
            />
          </div>

          <VButton 
            type="submit" 
            variant="primary" 
            class="w-full justify-center py-2.5 mt-2"
            :loading="isLoading"
            :disabled="isLoading"
          >
            {{ isLoginMode ? 'Entrar' : 'Cadastrar' }}
          </VButton>
        </form>
        
        <div class="mt-8 text-center text-sm font-body text-secondary">
          {{ isLoginMode ? "Ainda não tem conta?" : "Já possui conta?" }}
          <button @click="toggleMode" type="button" class="text-primary font-bold ml-1 transition-colors hover:underline">
            {{ isLoginMode ? 'Cadastre-se' : 'Entrar' }}
          </button>
        </div>
      </VCard>
    </div>
  </div>
</template>

