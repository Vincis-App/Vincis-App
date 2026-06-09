<script setup lang="ts">
import { ref, computed } from 'vue'
import { VModal } from '@/components/ui'

export type StudyModality = 'PDF' | 'VIDEO' | 'QUESTIONS' | 'LEGISLATION' | 'REVIEW'

const props = defineProps<{
    visible: boolean
    disciplineName: string
    elapsedSeconds: number
    selectedModalities: StudyModality[]
}>()

const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void
    (e: 'submit', data: {
        duration: number
        modalities: StudyModality[]
        questionsDone: number
        questionsCorrect: number
    }): void
    (e: 'cancel'): void
}>()

// ─── Local state (editable by user before submitting) ─────────────────────────
const modalities = ref<StudyModality[]>([...props.selectedModalities])
const duration = ref(Math.max(1, Math.round(props.elapsedSeconds / 60)))
const questionsDone = ref(0)
const questionsCorrect = ref(0)

// Reset local state when modal opens
function resetState() {
    modalities.value = [...props.selectedModalities]
    duration.value = Math.max(1, Math.round(props.elapsedSeconds / 60))
    questionsDone.value = 0
    questionsCorrect.value = 0
}

// Watch for visibility changes
defineExpose({ resetState })

const hitRate = computed(() => {
    if (questionsDone.value <= 0) return null
    return Math.round((questionsCorrect.value / questionsDone.value) * 100)
})

const hitRateColor = computed(() => {
    if (hitRate.value === null) return ''
    if (hitRate.value >= 80) return 'text-green-500'
    if (hitRate.value >= 60) return 'text-amber-500'
    return 'text-red-500'
})

const MODALITIES: { id: StudyModality; label: string; icon: string }[] = [
    { id: 'PDF', label: 'PDF / Leitura', icon: 'pi-file-pdf' },
    { id: 'VIDEO', label: 'Videoaula', icon: 'pi-play' },
    { id: 'QUESTIONS', label: 'Questões', icon: 'pi-question-circle' },
    { id: 'LEGISLATION', label: 'Lei Seca', icon: 'pi-briefcase' },
    { id: 'REVIEW', label: 'Revisão', icon: 'pi-replay' },
]

function toggleModality(id: StudyModality) {
    const idx = modalities.value.indexOf(id)
    if (idx >= 0) {
        // Don't allow empty
        if (modalities.value.length === 1) return
        modalities.value = modalities.value.filter(m => m !== id)
    } else {
        modalities.value = [...modalities.value, id]
    }
}

function handleSubmit() {
    emit('submit', {
        duration: duration.value,
        modalities: modalities.value,
        questionsDone: questionsDone.value,
        questionsCorrect: Math.min(questionsCorrect.value, questionsDone.value),
    })
}

function handleCancel() {
    emit('cancel')
    emit('update:visible', false)
}
</script>

<template>
    <VModal :visible="visible" @update:visible="handleCancel" header="Registro da Sessão">
        <template #default>
            <div class="flex flex-col gap-6">
                <!-- Discipline context -->
                <div class="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <i class="pi pi-check-circle text-lg"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-on-surface">{{ disciplineName }}</p>
                        <p class="text-xs text-on-surface-muted">Sessão finalizada</p>
                    </div>
                </div>

                <!-- Modalities -->
                <div class="flex flex-col gap-2">
                    <label
                        class="text-xs font-bold uppercase tracking-widest text-on-surface-muted flex items-center gap-2">
                        <i class="pi pi-tag text-xs text-primary"></i>
                        Modalidades (toque para alterar)
                    </label>
                    <div class="flex flex-wrap gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                        <button v-for="mod in MODALITIES" :key="mod.id" @click="toggleModality(mod.id)"
                            class="modality-chip"
                            :class="modalities.includes(mod.id) ? 'modality-chip--active' : 'modality-chip--inactive'">
                            <i class="pi text-xs" :class="mod.icon"></i>
                            <span>{{ mod.label }}</span>
                            <i v-if="modalities.includes(mod.id)" class="pi pi-check text-[10px] ml-0.5"></i>
                        </button>
                    </div>
                </div>

                <!-- Duration -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold uppercase tracking-widest text-on-surface-muted flex items-center gap-2">
                        <i class="pi pi-stopwatch text-xs text-primary"></i>
                        Duração (minutos)
                    </label>
                    <div class="relative">
                        <input type="number" min="1" v-model.number="duration"
                            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-bold font-sans transition-all" />
                        <i class="pi pi-clock absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted text-sm"></i>
                    </div>
                </div>

                <!-- Questions -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-widest text-on-surface-muted">Questões
                            Feitas</label>
                        <input type="number" min="0" v-model.number="questionsDone"
                            class="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-bold font-sans transition-all" />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-widest text-on-surface-muted">Acertos</label>
                        <input type="number" min="0" :max="questionsDone" v-model.number="questionsCorrect"
                            class="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm font-bold font-sans transition-all" />
                    </div>
                </div>

                <!-- Hit rate -->
                <div v-if="hitRate !== null"
                    class="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span class="text-sm font-medium text-on-surface-muted">Taxa de Acerto</span>
                    <span class="text-lg font-black" :class="hitRateColor">{{ hitRate }}%</span>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex gap-3 justify-end">
                <button @click="handleCancel"
                    class="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-muted hover:bg-surface-container-highest transition-colors">
                    Cancelar
                </button>
                <button @click="handleSubmit"
                    class="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2">
                    <i class="pi pi-save text-xs"></i>
                    Registrar Detalhes
                </button>
            </div>
        </template>
    </VModal>
</template>

<style scoped>
.modality-chip {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    cursor: pointer;
}

.modality-chip--active {
    background: var(--color-surface-container-lowest);
    border-color: var(--color-primary);
    color: var(--color-primary);
    box-shadow: 0 1px 4px color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.modality-chip--inactive {
    background: transparent;
    border-color: transparent;
    color: var(--color-on-surface-muted);
    opacity: 0.65;
}

.modality-chip--inactive:hover {
    opacity: 1;
    background: var(--color-surface-container-lowest);
    color: var(--color-on-surface);
}
</style>
