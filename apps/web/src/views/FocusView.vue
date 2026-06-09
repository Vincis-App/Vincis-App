<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { VModal, VSpinner } from '../components/ui'
import { useStudyPlanStore } from '../stores/study-plan'
import { useDisciplinesQuery } from '../hooks/useDisciplines'
import { useCreateFocusSessionMutation } from '../hooks/useFocusSessions'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { useToast } from 'primevue/usetoast'
import { generateMonthlySchedule } from '../helpers/scheduler'

import FocusHeader from '../components/features/focus/FocusHeader.vue'
import FocusEmptyState from '../components/features/focus/FocusEmptyState.vue'
import FocusConfig from '../components/features/focus/FocusConfig.vue'
import FocusActiveTimer from '../components/features/focus/FocusActiveTimer.vue'
import FocusSessionReport from '../components/features/focus/FocusSessionReport.vue'
import type { StudyModality } from '../components/features/focus/FocusSessionReport.vue'

const studyPlanStore = useStudyPlanStore()
const toast = useToast()

// ─── Data ─────────────────────────────────────────────────────────────────────
const { data: disciplinesData, isLoading: isLoadingDisciplines } = useDisciplinesQuery()
const disciplines = computed(() => {
    const list = (disciplinesData.value || []).filter(d => d.isActive !== false)
    
    try {
        const raw = localStorage.getItem('vincis_planner_settings_v2')
        if (raw) {
            const parsed = JSON.parse(raw)
            const disciplineConfigs = list.map(d => ({
                id: d.id,
                name: d.name,
                color: d.color,
                priority: (Math.min(4, Math.max(1, d.weight)) as 1 | 2 | 3 | 4),
                knowledgeLevel: parsed.knowledgeLevels?.[d.id] ?? 2,
            }))
            
            const settings = {
                revisionMode: parsed.revisionMode ?? 'auto',
                revisionRhythm: parsed.revisionRhythm ?? 'normal',
                studyDays: parsed.studyDays ?? [1, 2, 3, 4, 5],
                hoursPerDay: parsed.hoursPerDay ?? 4,
                subjectsPerDay: parsed.subjectsPerDay ?? 3,
                disciplines: disciplineConfigs,
            }
            
            const schedule = generateMonthlySchedule(new Date(), settings)
            const scheduledNames = new Set<string>()
            for (const sessions of Object.values(schedule)) {
                for (const s of sessions) {
                    const name = s.disciplineName.startsWith('↻ ') 
                        ? s.disciplineName.substring(2) 
                        : s.disciplineName
                    scheduledNames.add(name)
                }
            }
            
            return list.filter(d => scheduledNames.has(d.name))
        }
    } catch (e) {
        console.error('Error computing scheduled disciplines:', e)
    }
    
    return list
})
const { mutateAsync: saveFocusSession } = useCreateFocusSessionMutation()

// ─── Timer ────────────────────────────────────────────────────────────────────
const {
    settings,
    isRunning,
    isPaused,
    currentPhase,
    currentCycle,
    formattedTime,
    phaseLabel,
    phaseColor,
    progress,
    isSessionComplete,
    sessionStartedAt,
    totalElapsed,
    startTimer,
    pauseTimer,
    resumeTimer,
    skipPhase,
    stopTimer,
    resetTimer,
} = usePomodoroTimer()

// ─── Local State ──────────────────────────────────────────────────────────────
const selectedDisciplineId = ref<number | null>(null)
const selectedModalities = ref<StudyModality[]>(['PDF'])
const showLeaveDialog = ref(false)
const showReportModal = ref(false)
const pendingNavigation = ref<any>(null)
const reportCompleted = ref(false)

const selectedDiscipline = computed(() =>
    disciplines.value.find((d: any) => d.id === selectedDisciplineId.value)
)

// ─── SVG Timer ────────────────────────────────────────────────────────────────
const RADIUS = 140
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const strokeDashoffset = computed(() => {
    return CIRCUMFERENCE - (progress.value / 100) * CIRCUMFERENCE
})

// ─── Session Complete Watcher ─────────────────────────────────────────────────
watch(isSessionComplete, (completed) => {
    if (completed && sessionStartedAt.value) {
        reportCompleted.value = true
        showReportModal.value = true
    }
})

// ─── Actions ──────────────────────────────────────────────────────────────────
function handleStart() {
    if (!selectedDisciplineId.value) return
    startTimer()
}

function handlePauseResume() {
    if (isPaused.value) {
        resumeTimer()
    } else {
        pauseTimer()
    }
}

function handleStop() {
    // Open report modal instead of saving automatically
    reportCompleted.value = false
    showReportModal.value = true
    pauseTimer()
}

function handleApplyPreset(minutes: number) {
    settings.value.focusTime = minutes
}

async function handleReportSubmit(data: {
    duration: number
    modalities: StudyModality[]
    questionsDone: number
    questionsCorrect: number
}) {
    if (!selectedDisciplineId.value || !sessionStartedAt.value) {
        showReportModal.value = false
        resetTimer()
        return
    }

    // Skip saving sessions shorter than 60 seconds unless completed
    if (totalElapsed.value < 60 && !reportCompleted.value) {
        showReportModal.value = false
        resetTimer()
        toast.add({
            severity: 'info',
            summary: 'Sessão muito curta',
            detail: 'Sessões com menos de 1 minuto não são salvas.',
            life: 3000,
        })
        return
    }

    const cyclesCompleted = reportCompleted.value
        ? settings.value.cycles
        : Math.max(0, currentCycle.value - 1)

    try {
        await saveFocusSession({
            disciplineId: selectedDisciplineId.value,
            duration: data.duration * 60, // convert to seconds
            focusTime: settings.value.focusTime * 60,
            breakTime: settings.value.breakTime * 60,
            longBreakTime: settings.value.longBreakTime * 60,
            cyclesTarget: settings.value.cycles,
            cyclesCompleted,
            isCompleted: reportCompleted.value,
            modalities: data.modalities,
            questionsDone: data.questionsDone,
            questionsCorrect: data.questionsCorrect,
            startedAt: sessionStartedAt.value.toISOString(),
            finishedAt: new Date().toISOString(),
        })

        toast.add({
            severity: 'success',
            summary: reportCompleted.value ? 'Sessão Completa! 🎉' : 'Sessão Salva',
            detail: reportCompleted.value
                ? 'Parabéns! Todos os ciclos foram concluídos.'
                : 'A sessão foi registrada com sucesso.',
            life: 5000,
        })
    } catch (err) {
        console.error('Erro ao salvar sessão de foco:', err)
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível salvar a sessão.',
            life: 3000,
        })
    }

    showReportModal.value = false
    resetTimer()
}

function handleReportCancel() {
    showReportModal.value = false
    // If the session was completed, still reset; otherwise resume
    if (reportCompleted.value) {
        resetTimer()
    } else {
        // Resume where they were if they cancel the report
        // Timer is already paused from handleStop
    }
}

// ─── Navigation Guard ─────────────────────────────────────────────────────────
onBeforeRouteLeave((to, from, next) => {
    if (isRunning.value) {
        pendingNavigation.value = next
        showLeaveDialog.value = true
        return false
    }
    next()
})

async function confirmLeave() {
    if (sessionStartedAt.value && totalElapsed.value >= 60) {
        // Quick save without report modal
        const cyclesCompleted = Math.max(0, currentCycle.value - 1)
        try {
            await saveFocusSession({
                disciplineId: selectedDisciplineId.value!,
                duration: totalElapsed.value,
                focusTime: settings.value.focusTime * 60,
                breakTime: settings.value.breakTime * 60,
                longBreakTime: settings.value.longBreakTime * 60,
                cyclesTarget: settings.value.cycles,
                cyclesCompleted,
                isCompleted: false,
                modalities: selectedModalities.value,
                startedAt: sessionStartedAt.value.toISOString(),
                finishedAt: new Date().toISOString(),
            })
        } catch (err) {
            console.error('Erro ao salvar sessão ao sair:', err)
        }
    }
    stopTimer()
    resetTimer()
    showLeaveDialog.value = false
    if (pendingNavigation.value) {
        pendingNavigation.value()
        pendingNavigation.value = null
    }
}

function cancelLeave() {
    showLeaveDialog.value = false
    pendingNavigation.value = null
}
</script>

<template>
    <div class="pb-12 animate-fade-in">
        <FocusHeader />

        <!-- Loading -->
        <div v-if="isLoadingDisciplines" class="flex justify-center items-center h-64">
            <VSpinner />
        </div>

        <!-- No Study Plan -->
        <FocusEmptyState v-else-if="!studyPlanStore.hasActivePlan" />

        <!-- Main Content -->
        <div v-else>
            <!-- ═══════════ CONFIGURATION STATE ═══════════ -->
            <transition name="phase-fade" mode="out-in">
                <FocusConfig v-if="!isRunning" key="config" :disciplines="disciplines"
                    v-model:selectedDisciplineId="selectedDisciplineId"
                    v-model:selectedModalities="selectedModalities"
                    :settings="settings"
                    @start="handleStart"
                    @apply-preset="handleApplyPreset" />

                <!-- ═══════════ TIMER ACTIVE STATE ═══════════ -->
                <FocusActiveTimer v-else key="timer" :selectedDiscipline="selectedDiscipline" :phaseColor="phaseColor"
                    :phaseLabel="phaseLabel" :formattedTime="formattedTime" :currentCycle="currentCycle"
                    :settings="settings" :currentPhase="currentPhase" :isPaused="isPaused" :totalElapsed="totalElapsed"
                    :strokeDashoffset="strokeDashoffset" :radius="RADIUS" :circumference="CIRCUMFERENCE"
                    @stop="handleStop" @pauseResume="handlePauseResume" @skip="skipPhase" />
            </transition>
        </div>

        <!-- ═══════════ SESSION REPORT MODAL ═══════════ -->
        <FocusSessionReport
            :visible="showReportModal"
            @update:visible="(val: boolean) => { if (!val) handleReportCancel() }"
            :discipline-name="selectedDiscipline?.name || 'Disciplina'"
            :elapsed-seconds="totalElapsed"
            :selected-modalities="selectedModalities"
            @submit="handleReportSubmit"
            @cancel="handleReportCancel"
        />

        <!-- ═══════════ LEAVE CONFIRMATION DIALOG ═══════════ -->
        <VModal :visible="showLeaveDialog" @update:visible="cancelLeave" header="Sessão em andamento">
            <template #default>
                <p class="text-on-surface-muted text-sm leading-relaxed">
                    Você tem uma sessão de foco em andamento. Deseja encerrá-la? A sessão parcial será salva
                    automaticamente.
                </p>
            </template>
            <template #footer>
                <div class="flex gap-3 justify-end">
                    <button @click="cancelLeave"
                        class="px-4 py-2 rounded-lg text-sm font-bold text-on-surface-muted hover:bg-surface-container-highest transition-colors">
                        Cancelar
                    </button>
                    <button @click="confirmLeave"
                        class="px-4 py-2 rounded-lg text-sm font-bold bg-error text-white hover:bg-error/90 transition-colors">
                        Encerrar e Sair
                    </button>
                </div>
            </template>
        </VModal>
    </div>
</template>

<style scoped>
/* ─── Animations ───────────────────────────────────────────────────────────── */
.animate-fade-in {
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.phase-fade-enter-active,
.phase-fade-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.phase-fade-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
}

.phase-fade-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.98);
}
</style>
