// apps/web/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/design-system',
      name: 'design-system',
      component: () => import('../views/DesignSystem.vue')
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue')
    },
    {
      path: '/private',
      name: 'private',
      component: () => import('../views/PrivateView.vue')
    },
    {
      path: '/pau',
      name: 'pau',
      component: () => import('../views/Pau.vue')
    }
  ],
})


export default router