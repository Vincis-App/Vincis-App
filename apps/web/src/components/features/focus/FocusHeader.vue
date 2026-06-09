<script setup lang="ts">
import { useDailyProgress } from '../../../hooks/useDailyProgress'

const { minutesStudiedToday, progressPercent, sessionsToday } = useDailyProgress()
</script>

<template>
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div class="space-y-2">
            <p class="font-label text-xs uppercase tracking-[0.2em] text-primary font-bold">Produtividade</p>
            <h2 class="text-4xl md:text-5xl font-headline font-bold text-on-surface tracking-tight text-left">
                Modo Foco
            </h2>
            <p class="text-on-surface-muted max-w-xl text-sm leading-relaxed text-left">
                Inicie sessões cronometradas de estudo com o método Pomodoro. Selecione uma disciplina e concentre-se.
            </p>
        </div>

        <!-- Daily Progress Card -->
        <div class="daily-progress-card">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <i class="pi pi-chart-line text-primary text-xs"></i>
                    </div>
                    <span class="text-xs font-bold uppercase tracking-widest text-on-surface-muted">Hoje</span>
                </div>
                <span class="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {{ sessionsToday }} {{ sessionsToday === 1 ? 'sessão' : 'sessões' }}
                </span>
            </div>

            <div class="flex items-end gap-2 mb-2">
                <span class="text-2xl font-black text-on-surface tabular-nums leading-none">
                    {{ minutesStudiedToday }}
                </span>
                <span class="text-xs font-bold text-on-surface-muted mb-0.5">min focados</span>
            </div>

            <!-- Progress bar -->
            <div class="progress-bar-track">
                <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
            </div>
            <p class="text-[10px] text-on-surface-muted text-right mt-1 tabular-nums">
                {{ progressPercent }}% da meta diária
            </p>
        </div>
    </header>
</template>

<style scoped>
.daily-progress-card {
    min-width: 220px;
    max-width: 280px;
    padding: 1rem 1.25rem;
    background: var(--color-surface-container-lowest);
    border: 1px solid var(--color-outline-variant);
    border-radius: 1.25rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.progress-bar-track {
    height: 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--color-primary);
    transition: width 0.5s ease-out;
}

.tabular-nums {
    font-variant-numeric: tabular-nums;
}
</style>
