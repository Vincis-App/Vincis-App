import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../lib/axios'
import type { ScheduleSettings } from '../helpers/types'

export const useStudyPlanStore = defineStore('study-plan', () => {
    const activePlanId = ref<number | null>(null)
    const activePlanName = ref<string | null>(null)

    // --- NOVO: Estado das configurações do Planner ---
    const scheduleSettings = ref<ScheduleSettings>(
        JSON.parse(localStorage.getItem('schedule_settings') || JSON.stringify({
            dailyHours: 4,
            workDays: [1, 2, 3, 4, 5],
            maxDisciplinesPerDay: 2,
            startDate: new Date().toISOString(),
            srsEnabled: true,
            srsMode: 'SMART',
            srsPace: 'NORMAL'
        }))
    );

    const hasActivePlan = computed(() => activePlanId.value !== null)

    async function selectPlan(planId: number, planName: string) {
        await api.post('/study-plans/select', { studyPlanId: planId })
        activePlanId.value = planId
        activePlanName.value = planName
    }

    // --- NOVO: Action para atualizar as configurações ---
    function setScheduleSettings(settings: any) {
        scheduleSettings.value = { ...scheduleSettings.value, ...settings }
        localStorage.setItem('schedule_settings', JSON.stringify(scheduleSettings.value))
    }

    function clearPlan() {
        activePlanId.value = null
        activePlanName.value = null
    }

    // Não esqueça de adicionar os novos campos no retorno!
    return { 
      activePlanId, 
      activePlanName, 
      hasActivePlan, 
      scheduleSettings, // <--- Adicionado
      selectPlan, 
      setScheduleSettings, // <--- Adicionado
      clearPlan 
    }
}, { persist: true })
