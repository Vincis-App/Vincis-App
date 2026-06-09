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
import { useErrorLogsQuery, useUpdateErrorLogMutation } from '../hooks/useErrorLogs'
import { useDailyProgress } from '../hooks/useDailyProgress'

import FocusHeader from '../components/features/focus/FocusHeader.vue'
import FocusEmptyState from '../components/features/focus/FocusEmptyState.vue'
import FocusActiveTimer from '../components/features/focus/FocusActiveTimer.vue'
import FocusSessionReport from '../components/features/focus/FocusSessionReport.vue'
import type { StudyModality } from '../components/features/focus/FocusSessionReport.vue'

const PRESETS = [
    { min: 25, label: 'Pomodoro', icon: 'pi-stopwatch' },
    { min: 50, label: '50 min', icon: 'pi-clock' },
    { min: 90, label: '90 min', icon: 'pi-hourglass' },
]

const MODALITIES: { id: StudyModality; label: string; icon: string }[] = [
    { id: 'PDF', label: 'PDF / Leitura', icon: 'pi-file-pdf' },
    { id: 'VIDEO', label: 'Videoaula', icon: 'pi-play' },
    { id: 'QUESTIONS', label: 'Questões', icon: 'pi-question-circle' },
    { id: 'LEGISLATION', label: 'Lei Seca', icon: 'pi-briefcase' },
    { id: 'REVIEW', label: 'Revisão', icon: 'pi-replay' },
]

const studyPlanStore = useStudyPlanStore()
const toast = useToast()

// ─── Local State ──────────────────────────────────────────────────────────────
const selectedDisciplineId = ref<number | null>(null)
const selectedModalities = ref<StudyModality[]>(['PDF'])
const showLeaveDialog = ref(false)
const showReportModal = ref(false)
const pendingNavigation = ref<any>(null)
const reportCompleted = ref(false)
const currentItemIndex = ref(0)

const expandedErrorId = ref<number | null>(null)
const editingErrorId = ref<number | null>(null)
const editErrorData = ref({
    analise: '',
    correcao: '',
    diagnostico: '',
    fonte: '',
})

// ─── Data & Queries ───────────────────────────────────────────────────────────
const { data: disciplinesData, isLoading: isLoadingDisciplines } = useDisciplinesQuery()
const { mutateAsync: saveFocusSession } = useCreateFocusSessionMutation()
const { data: errorLogsData } = useErrorLogsQuery(computed(() => ({
    disciplineId: selectedDisciplineId.value ?? undefined
})))
const { mutateAsync: updateErrorLog } = useUpdateErrorLogMutation()
const { minutesStudiedToday, progressPercent: dailyProgressPercent, dailyGoalMinutes } = useDailyProgress()

// ─── Computed Properties ──────────────────────────────────────────────────────
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
                priority: (Math.min(4, Math.max(1, d.weight ?? 2)) as 1 | 2 | 3 | 4),
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
    
    return []
})

const todaysQueue = computed(() => {
    const list = (disciplinesData.value || []).filter(d => d.isActive !== false)
    try {
        const raw = localStorage.getItem('vincis_planner_settings_v2')
        if (raw) {
            const parsed = JSON.parse(raw)
            const disciplineConfigs = list.map(d => ({
                id: d.id,
                name: d.name,
                color: d.color,
                priority: (Math.min(4, Math.max(1, d.weight ?? 2)) as 1 | 2 | 3 | 4),
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
            
            const today = new Date()
            const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            const schedule = generateMonthlySchedule(today, settings)
            return schedule[key] || []
        }
    } catch (e) {
        console.error('Error computing todays queue:', e)
    }
    return []
})

const errorLogs = computed(() => errorLogsData.value || [])

const selectedDiscipline = computed(() =>
    disciplines.value.find((d: any) => d.id === selectedDisciplineId.value)
)

// Auto-select first queue item
watch(todaysQueue, (queue) => {
    if (queue.length > 0 && !selectedDisciplineId.value) {
        const firstItem = queue[0]
        if (firstItem) {
            const rawName = firstItem.disciplineName.startsWith('↻ ') 
                ? firstItem.disciplineName.substring(2) 
                : firstItem.disciplineName
            const matchingDisc = disciplines.value.find(d => d.name === rawName)
            if (matchingDisc) {
                selectedDisciplineId.value = matchingDisc.id
                currentItemIndex.value = 0
            }
        }
    }
}, { immediate: true })

function toggleExpandError(id: number) {
    if (editingErrorId.value !== id) {
        expandedErrorId.value = expandedErrorId.value === id ? null : id
        if (expandedErrorId.value !== id) {
            editingErrorId.value = null
        }
    }
}

function startEditingError(error: any) {
    editingErrorId.value = error.id
    editErrorData.value = {
        analise: error.analise || '',
        correcao: error.correcao || '',
        diagnostico: error.diagnostico || 'Lacuna Teórica',
        fonte: error.fonte || '',
    }
}

async function saveErrorEdit(id: number) {
    try {
        await updateErrorLog({
            id,
            analise: editErrorData.value.analise,
            correcao: editErrorData.value.correcao,
            diagnostico: editErrorData.value.diagnostico as any,
            fonte: editErrorData.value.fonte,
        })
        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Erro atualizado com sucesso.',
            life: 3000,
        })
        editingErrorId.value = null
    } catch (err) {
        console.error('Erro ao atualizar erro:', err)
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível atualizar o erro.',
            life: 3000,
        })
    }
}

function cancelErrorEdit() {
    editingErrorId.value = null
}

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

function handleSelectQueueItem(index: number) {
    const item = todaysQueue.value[index]
    if (!item) return
    const rawName = item.disciplineName.startsWith('↻ ') 
        ? item.disciplineName.substring(2) 
        : item.disciplineName
    const matchingDisc = disciplines.value.find(d => d.name === rawName)
    if (matchingDisc) {
        selectedDisciplineId.value = matchingDisc.id
        currentItemIndex.value = index
        stopTimer()
        resetTimer()
        settings.value.focusTime = item.durationMin
    }
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

        // Advance to next queue item
        if (todaysQueue.value.length > 0 && currentItemIndex.value < todaysQueue.value.length - 1) {
            const nextIndex = currentItemIndex.value + 1
            handleSelectQueueItem(nextIndex)
        } else {
            toast.add({
                severity: 'success',
                summary: 'Parabéns!',
                detail: 'Você concluiu toda a fila de estudos de hoje!',
                life: 5000,
            })
            currentItemIndex.value = 0
            resetTimer()
        }
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
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
                <!-- Left Column: Player & Configuration & Error Logs -->
                <div class="lg:col-span-8 flex flex-col gap-6">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-bold text-on-surface">Modo Foco</h2>
                        <div class="flex items-center gap-2">
                            <span class="relative flex h-3 w-3">
                                <span v-if="isRunning" class="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3" :class="isRunning ? 'bg-primary' : 'bg-on-surface-muted'"></span>
                            </span>
                            <span class="text-sm text-on-surface-muted">{{ isRunning ? (isPaused ? 'Pausado' : 'Fluxo Ativo') : 'Pronto para iniciar' }}</span>
                        </div>
                    </div>

                    <!-- Circular Timer player container -->
                    <div class="bg-surface-container-low rounded-[2rem] border border-outline-variant/30 p-8 shadow-xl shadow-primary/5 relative">
                        <FocusActiveTimer :selectedDiscipline="selectedDiscipline" :phaseColor="isRunning ? phaseColor : 'var(--color-primary)'"
                            :phaseLabel="isRunning ? phaseLabel : 'Foco'" :formattedTime="formattedTime" :currentCycle="currentCycle"
                            :settings="settings" :currentPhase="currentPhase" :isPaused="!isRunning || isPaused" :totalElapsed="totalElapsed"
                            :strokeDashoffset="strokeDashoffset" :radius="RADIUS" :circumference="CIRCUMFERENCE"
                            :isRunning="isRunning"
                            @stop="handleStop" @pauseResume="isRunning ? handlePauseResume() : handleStart()" @skip="skipPhase" />
                    </div>

                    <!-- Quick Config Options (Presets, Modalities, Dropdown Selection) - Visible and interactive when not running -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300"
                        :class="{ 'opacity-50 pointer-events-none select-none': isRunning }">
                        <!-- Presets & Modalities Card -->
                        <div class="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-6 flex flex-col gap-5">
                            <!-- Presets -->
                            <div>
                                <span class="text-xs font-bold uppercase tracking-widest text-on-surface-muted block mb-3">Presets Rápidos</span>
                                <div class="flex gap-2">
                                    <button v-for="preset in PRESETS" :key="preset.min"
                                        @click="handleApplyPreset(preset.min)"
                                        class="preset-btn"
                                        :class="{ 'preset-btn--active': settings.focusTime === preset.min }">
                                        <i class="pi text-[10px]" :class="preset.icon"></i>
                                        <span>{{ preset.label }}</span>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Modalities -->
                            <div>
                                <span class="text-xs font-bold uppercase tracking-widest text-on-surface-muted block mb-3">Como vai estudar hoje?</span>
                                <div class="flex flex-wrap gap-2">
                                    <button v-for="mod in MODALITIES" :key="mod.id"
                                        @click="(() => {
                                            const current = [...selectedModalities]
                                            const idx = current.indexOf(mod.id)
                                            if (idx >= 0) {
                                                if (current.length === 1) return
                                                current.splice(idx, 1)
                                            } else {
                                                current.push(mod.id)
                                            }
                                            selectedModalities = current
                                        })()"
                                        class="modality-btn"
                                        :class="selectedModalities.includes(mod.id) ? 'modality-btn--active' : 'modality-btn--inactive'">
                                        <i class="pi text-xs" :class="mod.icon"></i>
                                        <span>{{ mod.label }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Discipline Selector & Time Adjuster -->
                        <div class="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-6 flex flex-col justify-between gap-5">
                            <!-- Dropdown Selector -->
                            <div>
                                <span class="text-xs font-bold uppercase tracking-widest text-on-surface-muted block mb-3">Disciplina Ativa</span>
                                <select v-model="selectedDisciplineId" 
                                    class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface p-3 text-sm font-bold focus:ring-2 focus:ring-primary/30 focus:border-primary">
                                    <option v-for="d in disciplines" :key="d.id" :value="d.id">
                                        {{ d.name }}
                                    </option>
                                    <option v-if="disciplines.length === 0" disabled :value="null">
                                        Nenhuma disciplina agendada
                                    </option>
                                </select>
                            </div>

                            <!-- Time Adjuster -->
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold uppercase tracking-widest text-on-surface-muted font-sans">Ajustar Tempo</span>
                                <div class="flex items-center gap-2 bg-surface-container-lowest rounded-xl p-1.5 border border-outline-variant/40">
                                    <button class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                                        @click="settings.focusTime = Math.max(1, settings.focusTime - 5)">
                                        <i class="pi pi-minus text-xs"></i>
                                    </button>
                                    <span class="text-sm font-bold font-mono px-3 select-none">{{ settings.focusTime }} min</span>
                                    <button class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                                        @click="settings.focusTime = Math.min(120, settings.focusTime + 5)">
                                        <i class="pi pi-plus text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Error Logs Mapped to Active Discipline -->
                    <div class="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-6 flex flex-col gap-4">
                        <div class="flex items-center justify-between">
                            <h3 class="font-bold text-base text-on-surface flex items-center gap-2">
                                <i class="pi pi-exclamation-triangle text-error text-lg"></i>
                                Erros Mapeados para {{ selectedDiscipline?.name || 'Disciplina' }}
                            </h3>
                            <span class="bg-error/10 text-error font-bold px-3 py-1 rounded-full text-xs">
                                {{ errorLogs.length }} erros
                            </span>
                        </div>

                        <div class="flex flex-col gap-3">
                            <p v-if="!selectedDisciplineId" class="text-sm text-on-surface-muted italic text-center py-6">
                                Selecione uma disciplina para ver os erros mapeados.
                            </p>
                            <p v-else-if="errorLogs.length === 0" class="text-sm text-on-surface-muted italic text-center py-6">
                                Nenhum erro registrado para esta disciplina.
                            </p>
                            <div v-else v-for="log in errorLogs" :key="log.id" class="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-lowest transition-all">
                                <!-- Header / Subject text (always visible) -->
                                <div class="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container-low transition-colors"
                                    @click="toggleExpandError(log.id)">
                                    <div class="flex flex-col gap-0.5">
                                        <span class="text-sm font-bold text-on-surface">{{ log.topic?.name || log.topicText || 'Geral' }}</span>
                                        <span class="text-xs text-on-surface-muted">Fonte: {{ log.fonte || 'Não informada' }}</span>
                                    </div>
                                    <i class="pi pi-chevron-down text-xs text-on-surface-muted transition-transform duration-200"
                                        :class="{ 'rotate-180': expandedErrorId === log.id }"></i>
                                </div>

                                <!-- Expanded Content -->
                                <div v-if="expandedErrorId === log.id" class="p-4 border-t border-outline-variant/30 flex flex-col gap-4 bg-surface-container-lowest">
                                    <!-- Editing state -->
                                    <div v-if="editingErrorId === log.id" class="flex flex-col gap-4">
                                        <div class="flex flex-col gap-1.5">
                                            <label class="text-xs font-bold text-on-surface-muted uppercase tracking-wider">Diagnóstico / Motivo</label>
                                            <select v-model="editErrorData.diagnostico" class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface p-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary">
                                                <option value="Lacuna Teórica">Lacuna Teórica</option>
                                                <option value="Falta de Atenção">Falta de Atenção</option>
                                                <option value="Interpretação">Erro de Interpretação</option>
                                                <option value="Pegadinha">Pegadinha</option>
                                                <option value="Falta de Tempo">Falta de Tempo</option>
                                            </select>
                                        </div>
                                        <div class="flex flex-col gap-1.5">
                                            <label class="text-xs font-bold text-on-surface-muted uppercase tracking-wider">Fonte da Questão</label>
                                            <input type="text" v-model="editErrorData.fonte" class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface p-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                                        </div>
                                        <div class="flex flex-col gap-1.5">
                                            <label class="text-xs font-bold text-on-surface-muted uppercase tracking-wider">Por que eu errei?</label>
                                            <textarea rows="2" v-model="editErrorData.analise" class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface p-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"></textarea>
                                        </div>
                                        <div class="flex flex-col gap-1.5">
                                            <label class="text-xs font-bold text-on-surface-muted uppercase tracking-wider">Resumo da Correção (Pulo do gato)</label>
                                            <textarea rows="3" v-model="editErrorData.correcao" class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface p-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"></textarea>
                                        </div>
                                        <div class="flex items-center justify-end gap-2">
                                            <button @click="cancelErrorEdit" class="px-3 py-1.5 text-xs font-bold text-on-surface-muted hover:bg-surface-container-highest rounded-lg transition-colors">
                                                Cancelar
                                            </button>
                                            <button @click="saveErrorEdit(log.id)" class="px-4 py-1.5 text-xs font-bold bg-primary text-on-primary rounded-lg hover:bg-primary/95 transition-colors shadow-sm">
                                                Salvar
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Viewing state -->
                                    <div v-else class="flex flex-col gap-4">
                                        <div class="flex items-start gap-3">
                                            <div class="bg-error/10 p-2 rounded-lg text-error flex items-center justify-center w-8 h-8">
                                                <i class="pi pi-question text-sm"></i>
                                            </div>
                                            <div class="flex flex-col gap-1 w-full">
                                                <span class="text-xs font-bold text-on-surface-muted uppercase tracking-wider">Por que eu errei?</span>
                                                <div class="text-sm text-on-surface bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 leading-relaxed">
                                                    <span class="font-bold text-error block mb-1">⚠️ {{ log.diagnostico }}</span>
                                                    <p class="whitespace-pre-line">{{ log.analise }}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex items-start gap-3">
                                            <div class="bg-green-500/10 p-2 rounded-lg text-green-500 flex items-center justify-center w-8 h-8">
                                                <i class="pi pi-lightbulb text-sm"></i>
                                            </div>
                                            <div class="flex flex-col gap-1 w-full">
                                                <span class="text-xs font-bold text-on-surface-muted uppercase tracking-wider">Resumo da Correção</span>
                                                <div class="text-sm text-on-surface bg-green-500/5 p-3 rounded-xl border border-green-500/20 leading-relaxed">
                                                    <p class="whitespace-pre-line">{{ log.correcao || 'Sem resumo cadastrado.' }}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex justify-end border-t border-outline-variant/20 pt-3">
                                            <button @click="startEditingError(log)" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                                                <i class="pi pi-pencil text-xs"></i>
                                                Editar Erro
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Daily Progress & Fila de Hoje -->
                <div class="lg:col-span-4 flex flex-col gap-6">
                    <!-- Progress Card -->
                    <div class="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 flex flex-col gap-3">
                        <div class="flex items-center justify-between">
                            <h3 class="font-bold text-on-surface text-sm">Progresso Diário</h3>
                            <span class="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded">
                                {{ minutesStudiedToday }}m / {{ dailyGoalMinutes }}m
                            </span>
                        </div>
                        <div class="w-full bg-outline-variant/20 h-2 rounded-full overflow-hidden">
                            <div class="bg-primary h-full rounded-full transition-all duration-500" :style="{ width: `${dailyProgressPercent}%` }"></div>
                        </div>
                        <p class="text-[11px] text-on-surface-muted text-right">{{ dailyProgressPercent }}% da meta diária atingida</p>
                    </div>

                    <!-- Fila de Hoje Card -->
                    <div class="bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col min-h-[350px]">
                        <div class="p-5 border-b border-outline-variant/20 bg-surface-container-low/50 rounded-t-2xl flex justify-between items-center">
                            <h3 class="font-bold text-on-surface text-sm flex items-center gap-2">
                                <i class="pi pi-list text-primary"></i>
                                Fila de Hoje
                            </h3>
                            <span class="text-xs text-on-surface-muted font-bold">{{ currentItemIndex + 1 }} / {{ todaysQueue.length }}</span>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <ul class="flex flex-col gap-2">
                                <li v-for="(item, idx) in todaysQueue" :key="idx" @click="handleSelectQueueItem(idx)"
                                    class="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border"
                                    :class="idx === currentItemIndex 
                                        ? 'bg-primary/5 border-primary/30 shadow-sm ring-1 ring-primary/20' 
                                        : idx < currentItemIndex 
                                            ? 'bg-surface-container-lowest/50 border-transparent opacity-60' 
                                            : 'bg-surface-container-lowest border-transparent hover:bg-surface-container-high'">
                                    <!-- Play/Check Indicator -->
                                    <div class="flex items-center justify-center w-5 h-5 rounded border mt-0.5"
                                        :class="idx === currentItemIndex 
                                            ? 'bg-primary border-primary text-on-primary' 
                                            : idx < currentItemIndex 
                                                ? 'bg-green-500 border-green-500 text-white' 
                                                : 'border-outline-variant text-transparent'">
                                        <i class="pi text-[9px]" :class="idx === currentItemIndex ? 'pi-play' : 'pi-check'"></i>
                                    </div>
                                    
                                    <!-- Item info -->
                                    <div class="flex flex-col w-full min-w-0">
                                        <span class="text-xs font-bold px-1.5 py-0.5 rounded uppercase text-[10px] w-fit"
                                            :class="item.disciplineName.startsWith('↻ ') 
                                                ? 'bg-purple-500/10 text-purple-500' 
                                                : 'bg-primary/10 text-primary'">
                                            {{ item.disciplineName.startsWith('↻ ') ? 'Revisão' : 'Teoria' }}
                                        </span>
                                        <span class="text-sm font-bold text-on-surface mt-1 truncate">
                                            {{ item.disciplineName.startsWith('↻ ') ? item.disciplineName.substring(2) : item.disciplineName }}
                                        </span>
                                        <div class="flex items-center gap-1.5 mt-1 text-on-surface-muted">
                                            <i class="pi pi-clock text-[10px]"></i>
                                            <span class="text-xs font-mono">{{ item.durationMin }} min</span>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
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

/* ─── Preset Buttons ─── */
.preset-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.2s ease;
    cursor: pointer;
    background: var(--color-surface-container-low);
    color: var(--color-on-surface-muted);
    border: 1px solid transparent;
}

.preset-btn:hover {
    background: var(--color-surface-container-highest);
    color: var(--color-on-surface);
    border-color: var(--color-outline-variant);
}

.preset-btn--active {
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
    border-color: var(--color-primary);
}

/* ─── Modality Buttons ─── */
.modality-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    border-radius: 0.75rem;
    font-size: 0.8rem;
    font-weight: 700;
    transition: all 0.2s ease;
    border: 1.5px solid transparent;
    cursor: pointer;
}

.modality-btn--active {
    background: var(--color-surface-container-lowest);
    border-color: var(--color-primary);
    color: var(--color-primary);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.modality-btn--inactive {
    background: transparent;
    color: var(--color-on-surface-muted);
    opacity: 0.6;
}

.modality-btn--inactive:hover {
    opacity: 1;
    background: var(--color-surface-container);
}
</style>
