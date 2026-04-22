import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const DEFAULT_USER = {
  name: 'Usuário Vincis',
  email: 'usuario@vincis.com',
  avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref<any>({ ...DEFAULT_USER })
  
  const isAuthenticated = ref(false)

  function login(userData: any) {
    isAuthenticated.value = true
    // Always merge with DEFAULT_USER to ensure all required fields exist
    user.value = {
      ...DEFAULT_USER,
      ...(userData || {})
    }
  }

  function logout() {
    isAuthenticated.value = false
    user.value = { ...DEFAULT_USER }
    // Clean up local storage or other persistence if any
    router.push('/auth')
  }

  return {
    user,
    isAuthenticated,
    login,
    logout
  }
})
