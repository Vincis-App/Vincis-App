import { computed } from 'vue'
import { useFocusSessionsQuery } from './useFocusSessions'

const DEFAULT_DAILY_GOAL_MINUTES = 240 // 4 horas

/**
 * Hook que calcula o progresso diário de estudo com base nas sessões de foco.
 * Consome o cache de `useFocusSessionsQuery` sem disparar refetch extra.
 */
export function useDailyProgress(dailyGoalMinutes = DEFAULT_DAILY_GOAL_MINUTES) {
    const { data: sessionsData } = useFocusSessionsQuery()

    const todaySessions = computed(() => {
        if (!sessionsData.value) return []
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        return sessionsData.value.filter((s) => {
            const sessionDate = new Date(s.startedAt)
            const sessionStr = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`
            return sessionStr === todayStr
        })
    })

    const minutesStudiedToday = computed(() => {
        return todaySessions.value.reduce((acc, s) => acc + Math.round(s.duration / 60), 0)
    })

    const progressPercent = computed(() => {
        return Math.min(100, Math.round((minutesStudiedToday.value / dailyGoalMinutes) * 100))
    })

    const sessionsToday = computed(() => todaySessions.value.length)

    return {
        todaySessions,
        minutesStudiedToday,
        progressPercent,
        sessionsToday,
        dailyGoalMinutes,
    }
}
