<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDisciplinesQuery, useUpdateDisciplineMutation } from '@/hooks/useDisciplines';
import { useStudyLogs } from '@/hooks/useStudyLogs';
import { generateMonthlySchedule } from '@/helpers/scheduler';
import { useStudyPlanStore } from '@/stores/study-plan';
import type { Proficiency, Priority, Discipline } from '@/helpers/types';

const studyPlanStore = useStudyPlanStore();
const viewingDate = ref(new Date());
const isSettingsOpen = ref(false);
const selectedDay = ref<number | null>(null);
const expandedDiscId = ref<number | null>(null);

const { data: realDisciplines } = useDisciplinesQuery();
const { studyLogsQuery } = useStudyLogs();
const updateDiscipline = useUpdateDisciplineMutation();

// Matérias de Teste (Mock)
const testDisciplines = ref<Discipline[]>([
  { id: 991, name: 'Matemática', color: '#ef4444', weight: 10, priority: 'HIGH', active: true, proficiency: 'BASIC' },
  { id: 992, name: 'Português', color: '#3b82f6', weight: 8, priority: 'HIGH', active: true, proficiency: 'INTERMEDIATE' },
  { id: 993, name: 'História', color: '#10b981', weight: 5, priority: 'MEDIUM', active: true, proficiency: 'ADVANCED' },
  { id: 994, name: 'Física', color: '#f59e0b', weight: 3, priority: 'LOW', active: true, proficiency: 'BASIC' },
  { id: 995, name: 'Direito', color: '#8b5cf6', weight: 7, priority: 'MEDIUM', active: true, proficiency: 'INTERMEDIATE' },
]);

const disciplines = computed(() => {
  if (!realDisciplines.value || realDisciplines.value.length === 0) return testDisciplines.value;
  return realDisciplines.value;
});

const handleUpdateDiscipline = (disc: any, updates: any) => {
  if (disc.id >= 990) {
    const target = testDisciplines.value.find(d => d.id === disc.id);
    if (target) {
        Object.assign(target, updates);
        // Forçar reatividade no array
        testDisciplines.value = [...testDisciplines.value];
    }
  } else {
    updateDiscipline.mutate({ id: disc.id, ...updates });
  }
};

// Calendário Logic
const daysInMonth = computed(() => new Date(viewingDate.value.getFullYear(), viewingDate.value.getMonth() + 1, 0).getDate());
const firstDayOffset = computed(() => new Date(viewingDate.value.getFullYear(), viewingDate.value.getMonth(), 1).getDay());

const monthlySchedule = computed(() => {
  return generateMonthlySchedule(
    viewingDate.value.getFullYear(),
    viewingDate.value.getMonth(),
    disciplines.value,
    studyPlanStore.scheduleSettings,
    studyLogsQuery.data.value || []
  );
});

const nextMonth = () => viewingDate.value = new Date(viewingDate.value.getFullYear(), viewingDate.value.getMonth() + 1, 1);
const prevMonth = () => viewingDate.value = new Date(viewingDate.value.getFullYear(), viewingDate.value.getMonth() - 1, 1);
const monthLabel = computed(() => viewingDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase());

const isToday = (day: number) => {
  const d = new Date();
  return d.getDate() === day && d.getMonth() === viewingDate.value.getMonth() && d.getFullYear() === viewingDate.value.getFullYear();
};

const toggleDay = (dayNum: number) => {
  const current = [...studyPlanStore.scheduleSettings.workDays];
  if (current.includes(dayNum)) {
    if (current.length > 1) studyPlanStore.scheduleSettings.workDays = current.filter(d => d !== dayNum);
  } else {
    studyPlanStore.scheduleSettings.workDays = [...current, dayNum].sort();
  }
};

const toggleExpanded = (id: number) => {
  expandedDiscId.value = expandedDiscId.value === id ? null : id;
};

// Persistência
watch(() => studyPlanStore.scheduleSettings, (newVal) => {
  localStorage.setItem('schedule_settings', JSON.stringify(newVal));
}, { deep: true });

</script>

<template>
  <div class="planner-container">
    <!-- Header -->
    <header class="planner-header">
      <div class="header-content">
        <div class="brand">
          <div class="logo-icon"><i class="ph-sparkle"></i></div>
          <div class="brand-text">
            <h1>Vincis <span>Planner</span></h1>
            <p>Agenda Inteligente</p>
          </div>
        </div>
        <div class="month-nav">
          <button @click="prevMonth" class="nav-btn"><i class="ph-caret-left"></i></button>
          <span class="current-month">{{ monthLabel }}</span>
          <button @click="nextMonth" class="nav-btn"><i class="ph-caret-right"></i></button>
        </div>
        <div class="header-actions">
          <button @click="isSettingsOpen = true" class="settings-trigger">
            <i class="ph-sliders"></i>
            <span>Personalizar</span>
          </button>
        </div>
      </div>
    </header>

    <main class="calendar-wrapper">
      <div class="weekdays-bar">
        <span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SAB</span>
      </div>
      <div class="days-grid">
        <div v-for="empty in firstDayOffset" :key="'empty-'+empty" class="day-slot empty"></div>
        <div v-for="day in daysInMonth" :key="day" 
             class="day-slot" 
             :class="{ 'is-today': isToday(day), 'is-rest': !monthlySchedule[day] }"
             @click="monthlySchedule[day] && (selectedDay = day)">
          <div class="day-header">
            <span class="day-number">{{ day }}</span>
            <span v-if="monthlySchedule[day]" class="daily-total">
                {{ (monthlySchedule[day].reduce((acc, i) => acc + i.durationMinutes, 0) / 60).toFixed(1) }}h
            </span>
          </div>
          <div class="day-content">
            <template v-if="monthlySchedule[day]">
              <div v-for="(item, idx) in monthlySchedule[day].slice(0, 3)" :key="idx" 
                   class="study-card" :style="{ '--disc-color': item.discipline.color }">
                <div class="card-pill"></div>
                <span class="disc-name">{{ item.discipline.name }}</span>
              </div>
              <div v-if="monthlySchedule[day].length > 3" class="more-indicator">
                +{{ monthlySchedule[day].length - 3 }} matérias
              </div>
            </template>
            <div v-else class="rest-indicator">
                <i class="ph-coffee"></i>
                <span>Folga</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Daily Details Modal -->
    <Transition name="fade">
      <div v-if="selectedDay" class="modal-overlay" @click="selectedDay = null">
        <div class="modal-content" @click.stop>
          <header class="modal-header">
            <div class="modal-title">
              <h2>{{ selectedDay }} de {{ viewingDate.toLocaleDateString('pt-BR', { month: 'long' }) }}</h2>
              <p>Cronograma do Dia</p>
            </div>
            <button @click="selectedDay = null" class="close-modal"><i class="ph-x"></i></button>
          </header>
          <div class="modal-body">
            <div v-for="(item, idx) in monthlySchedule[selectedDay]" :key="idx" class="detail-card" :style="{ '--color': item.discipline.color }">
              <div class="detail-icon" :style="{ backgroundColor: item.discipline.color + '20', color: item.discipline.color }">
                <i :class="item.type === 'THEORY' ? 'ph-book-open' : 'ph-arrows-counter-clockwise'"></i>
              </div>
              <div class="detail-info">
                <div class="detail-row">
                  <span class="detail-name">{{ item.discipline.name }}</span>
                  <span class="detail-duration">{{ item.durationMinutes }} min</span>
                </div>
                <div class="detail-tags">
                  <span class="tag" :class="item.type">{{ item.type === 'THEORY' ? 'Teoria Nova' : 'Revisão Espaçada' }}</span>
                  <span v-if="item.discipline.priority === 'HIGH'" class="tag high">Alta Prioridade</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Settings Drawer -->
    <Transition name="slide">
      <aside v-if="isSettingsOpen" class="settings-drawer">
        <div class="drawer-overlay" @click="isSettingsOpen = false"></div>
        <div class="drawer-content">
          <header class="drawer-header">
            <div class="header-title">
              <i class="ph-gear-six-bold"></i>
              <h3>Ajustes Estratégicos</h3>
            </div>
            <button @click="isSettingsOpen = false" class="close-btn"><i class="ph-x"></i></button>
          </header>

          <div class="drawer-scroll">
            <div class="drawer-padding">
              
              <!-- SRS Intelligence -->
              <section class="config-section srs-box">
                <div class="section-header">
                  <div class="header-left">
                    <i class="ph-brain"></i>
                    <label>Revisão Inteligente (SRS)</label>
                  </div>
                  <label class="switch">
                    <input type="checkbox" v-model="studyPlanStore.scheduleSettings.srsEnabled">
                    <span class="switch-slider"></span>
                  </label>
                </div>
                
                <div v-if="studyPlanStore.scheduleSettings.srsEnabled" class="srs-controls">
                  <div class="mode-toggle">
                    <button @click="studyPlanStore.scheduleSettings.srsMode = 'SMART'" 
                            :class="{ active: studyPlanStore.scheduleSettings.srsMode === 'SMART' }">
                      IA (Smart)
                    </button>
                    <button @click="studyPlanStore.scheduleSettings.srsMode = 'MANUAL'" 
                            :class="{ active: studyPlanStore.scheduleSettings.srsMode === 'MANUAL' }">
                      Manual
                    </button>
                  </div>
                  
                  <div v-if="studyPlanStore.scheduleSettings.srsMode === 'MANUAL'" class="pace-selector">
                    <span class="sub-label">Ritmo das Revisões</span>
                    <div class="pace-grid">
                      <button v-for="pace in (['ACCELERATED', 'NORMAL', 'RELAXED'] as const)" :key="pace"
                              @click="studyPlanStore.scheduleSettings.srsPace = pace"
                              :class="{ active: studyPlanStore.scheduleSettings.srsPace === pace }">
                        {{ pace === 'ACCELERATED' ? 'Intenso' : pace === 'NORMAL' ? 'Normal' : 'Suave' }}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Daily Goals -->
              <section class="config-section">
                <div class="section-header"><i class="ph-target"></i><label>Metas Diárias</label></div>
                <div class="control-group">
                  <div class="label-row">
                    <span>Tempo de Estudo</span>
                    <span class="badge">{{ studyPlanStore.scheduleSettings.dailyHours }}h</span>
                  </div>
                  <input type="range" min="1" max="10" step="0.5" v-model="studyPlanStore.scheduleSettings.dailyHours" class="range-input">
                </div>
                <div class="control-group">
                  <div class="label-row">
                    <span>Disciplinas p/ Dia</span>
                    <span class="badge">{{ studyPlanStore.scheduleSettings.maxDisciplinesPerDay }}</span>
                  </div>
                  <input type="range" min="1" max="6" step="1" v-model="studyPlanStore.scheduleSettings.maxDisciplinesPerDay" class="range-input orange">
                </div>
              </section>

              <!-- Active Days -->
              <section class="config-section">
                <div class="section-header"><i class="ph-calendar-plus"></i><label>Dias de Estudo</label></div>
                <div class="days-grid-mini">
                  <button v-for="(day, idx) in ['D','S','T','Q','Q','S','S']" :key="idx"
                          @click="toggleDay(idx)"
                          :class="{ active: studyPlanStore.scheduleSettings.workDays.includes(idx) }"
                          class="day-btn">
                    {{ day }}
                  </button>
                </div>
              </section>

              <!-- Discipline List (Accordion) -->
              <section class="disciplines-section">
                <div class="section-header"><i class="ph-books"></i><label>Disciplinas Ativas</label></div>
                <div class="discipline-list">
                  <div v-for="disc in disciplines" :key="disc.id" 
                       class="disc-item-card" 
                       :class="{ expanded: expandedDiscId === disc.id, inactive: disc.active === false }">
                    
                    <div class="disc-main" @click="disc.active !== false && toggleExpanded(disc.id)">
                      <div class="disc-left">
                        <div class="disc-color-dot" :style="{ backgroundColor: disc.color }"></div>
                        <div class="disc-info-main">
                          <span class="disc-title">{{ disc.name }}</span>
                          <span class="disc-meta-tag" :class="String(disc.proficiency)">{{ disc.proficiency }}</span>
                        </div>
                      </div>
                      <div class="disc-right">
                        <label class="switch" @click.stop>
                          <input type="checkbox" :checked="disc.active !== false" 
                                 @change="handleUpdateDiscipline(disc, { active: disc.active === false ? true : false })">
                          <span class="switch-slider mini"></span>
                        </label>
                        <i v-if="disc.active !== false" class="ph-caret-down caret" :class="{ up: expandedDiscId === disc.id }"></i>
                      </div>
                    </div>

                    <div v-if="expandedDiscId === disc.id && disc.active !== false" class="disc-expanded">
                      <!-- Proficiency -->
                      <div class="config-row">
                        <span class="row-label">Nível de Domínio</span>
                        <div class="toggle-group">
                          <button v-for="lv in (['BASIC', 'INTERMEDIATE', 'ADVANCED'] as Proficiency[])" :key="lv"
                                  @click="handleUpdateDiscipline(disc, { proficiency: lv })"
                                  :class="{ active: disc.proficiency === lv }">
                            {{ lv === 'BASIC' ? 'Básico' : lv === 'INTERMEDIATE' ? 'Médio' : 'Avançado' }}
                          </button>
                        </div>
                      </div>
                      <!-- Priority -->
                      <div class="config-row">
                        <span class="row-label">Prioridade (Edital)</span>
                        <div class="toggle-group red">
                          <button v-for="pr in (['LOW', 'MEDIUM', 'HIGH'] as Priority[])" :key="pr"
                                  @click="handleUpdateDiscipline(disc, { priority: pr })"
                                  :class="{ active: disc.priority === pr }">
                            {{ pr === 'LOW' ? 'Baixa' : pr === 'MEDIUM' ? 'Média' : 'Alta' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<style scoped>
/* Reset & Fonts */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Inter:wght@400;500;700&display=swap');

.planner-container {
  min-height: 100vh;
  background: #fdfdfe;
  color: #0f172a;
  font-family: 'Inter', sans-serif;
  --primary: #6366f1;
  --secondary: #a855f7;
  --orange: #f59e0b;
}

/* Header */
.planner-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #f1f5f9;
  padding: 0.75rem 2rem;
  position: sticky; top: 0; z-index: 50;
}
.header-content {
  max-width: 1400px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
}
.brand { display: flex; align-items: center; gap: 1rem; }
.logo-icon {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 14px; display: flex; align-items: center; justify-content: center;
  color: white; font-size: 1.5rem; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}
.brand-text h1 { font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; line-height: 1.1; }
.brand-text h1 span { color: var(--primary); }
.brand-text p { font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

.month-nav {
  display: flex; align-items: center; gap: 0.75rem;
  background: #f8fafc; padding: 0.4rem 0.6rem; border-radius: 100px;
  border: 1px solid #f1f5f9;
}
.nav-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; }
.nav-btn:hover { background: white; color: var(--primary); box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
.current-month { font-weight: 700; min-width: 160px; text-align: center; font-size: 0.85rem; font-family: 'Outfit', sans-serif; letter-spacing: 0.02em; }

.settings-trigger {
  display: flex; align-items: center; gap: 0.5rem;
  background: white; padding: 0.6rem 1.2rem; border-radius: 12px;
  border: 1px solid #e2e8f0; font-weight: 700; font-size: 0.85rem; color: #475569;
  transition: all 0.2s;
}
.settings-trigger:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-1px); }

/* Calendar Grid */
.calendar-wrapper { max-width: 1400px; margin: 1.5rem auto; padding: 0 2rem; }
.weekdays-bar { 
  display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 0.75rem;
  padding: 0 1rem;
}
.weekdays-bar span { text-align: center; color: #94a3b8; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; }

.days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.75rem; }
.day-slot {
  min-height: 140px; background: white; border-radius: 20px;
  border: 1px solid #f1f5f9; padding: 1rem; display: flex; flex-direction: column;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}
.day-slot:hover { transform: scale(1.02); box-shadow: 0 10px 25px rgba(0,0,0,0.04); border-color: var(--primary); }
.day-slot.is-today { border-color: var(--primary); background: #f5f3ff; border-width: 2px; }
.day-slot.is-rest { opacity: 0.6; background: #f8fafc; border-style: dashed; }
.day-slot.empty { border: none; background: transparent; cursor: default; }
.day-slot.empty:hover { transform: none; box-shadow: none; }

.day-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.day-number { font-size: 1.15rem; font-weight: 800; color: #cbd5e1; font-family: 'Outfit', sans-serif; }
.is-today .day-number { color: var(--primary); }
.daily-total { font-size: 0.7rem; font-weight: 700; color: #94a3b8; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 6px; }

.day-content { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; }
.study-card {
  --disc-color: #6366f1;
  background: white; border-radius: 10px; border: 1px solid #f1f5f9; padding: 0.35rem 0.5rem;
  display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.card-pill { width: 6px; height: 6px; border-radius: 50%; background: var(--disc-color); }
.disc-name { font-size: 0.7rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.more-indicator { font-size: 0.65rem; font-weight: 800; color: var(--primary); text-align: center; margin-top: 0.2rem; }
.rest-indicator { 
    display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;
    color: #94a3b8; gap: 0.25rem; font-size: 0.7rem; font-weight: 700;
}
.rest-indicator i { font-size: 1.25rem; }

/* Modal Styles */
.modal-overlay {
  position: fixed; inset: 0; z-index: 200; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}
.modal-content {
  background: white; width: 100%; max-width: 480px; border-radius: 28px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.15); overflow: hidden;
}
.modal-header {
  padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9;
  display: flex; justify-content: space-between; align-items: center;
}
.modal-title h2 { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; }
.modal-title p { color: #94a3b8; font-size: 0.85rem; font-weight: 600; }
.close-modal { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #64748b; }

.modal-body { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1rem; max-height: 60vh; overflow-y: auto; }
.detail-card {
  --color: #6366f1;
  display: flex; gap: 1rem; padding: 1rem; background: #fdfdfe; border: 1px solid #f1f5f9; border-radius: 18px;
}
.detail-icon {
  width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
}
.detail-info { flex: 1; }
.detail-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.detail-name { font-weight: 800; color: #1e293b; font-size: 1rem; }
.detail-duration { font-family: 'Outfit', sans-serif; font-weight: 700; color: var(--primary); font-size: 0.9rem; }
.detail-tags { display: flex; gap: 0.5rem; }
.tag { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: 6px; }
.tag.THEORY { background: #eef2ff; color: var(--primary); }
.tag.REVIEW { background: #fdf2f8; color: #db2777; }
.tag.high { background: #fee2e2; color: #ef4444; }

/* Settings Drawer */
.settings-drawer { position: fixed; inset: 0; z-index: 100; }
.drawer-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.2); backdrop-filter: blur(4px); }
.drawer-content {
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 420px; background: white; display: flex; flex-direction: column;
  box-shadow: -20px 0 50px rgba(0,0,0,0.05);
}
.drawer-header { padding: 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.header-title { display: flex; align-items: center; gap: 0.75rem; color: #1e293b; }
.header-title i { font-size: 1.5rem; color: var(--primary); }
.header-title h3 { font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 800; }
.close-btn { width: 36px; height: 36px; border-radius: 50%; background: #f8fafc; display: flex; align-items: center; justify-content: center; color: #64748b; }

.drawer-scroll { flex: 1; overflow-y: auto; scroll-behavior: smooth; }
.drawer-padding { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 2rem; }

/* Config Components */
.config-section { display: flex; flex-direction: column; gap: 1rem; }
.section-header { display: flex; align-items: center; gap: 0.75rem; }
.section-header i { color: var(--primary); font-size: 1.25rem; }
.section-header label { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.95rem; color: #334155; }

.srs-box { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 20px; padding: 1.25rem; }
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.srs-controls { margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.mode-toggle { display: flex; background: #ede9fe; padding: 0.25rem; border-radius: 12px; }
.mode-toggle button { 
    flex: 1; padding: 0.5rem; font-size: 0.8rem; font-weight: 700; border-radius: 10px;
    color: #7c3aed; transition: all 0.2s;
}
.mode-toggle button.active { background: white; color: var(--primary); box-shadow: 0 2px 6px rgba(0,0,0,0.05); }

.pace-selector { display: flex; flex-direction: column; gap: 0.5rem; }
.sub-label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
.pace-grid { display: flex; gap: 0.4rem; }
.pace-grid button { 
    flex: 1; padding: 0.5rem; font-size: 0.75rem; font-weight: 700; border-radius: 8px;
    background: white; border: 1px solid #ddd6fe; color: #6d28d9;
}
.pace-grid button.active { background: var(--primary); color: white; border-color: var(--primary); }

.control-group { display: flex; flex-direction: column; gap: 0.5rem; }
.label-row { display: flex; justify-content: space-between; align-items: center; }
.label-row span { font-size: 0.85rem; font-weight: 600; color: #64748b; }
.badge { background: #eef2ff; color: var(--primary); padding: 0.2rem 0.6rem; border-radius: 8px; font-weight: 800; font-family: 'Outfit', sans-serif; }

.range-input { width: 100%; accent-color: var(--primary); height: 6px; border-radius: 10px; }
.range-input.orange { accent-color: var(--orange); }

.days-grid-mini { display: flex; gap: 0.4rem; justify-content: space-between; }
.day-btn {
  width: 44px; height: 44px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0;
  color: #64748b; font-weight: 800; font-family: 'Outfit', sans-serif; transition: all 0.2s;
}
.day-btn.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); }

/* Discipline Accordion */
.discipline-list { display: flex; flex-direction: column; gap: 0.75rem; }
.disc-item-card { 
    background: white; border: 1px solid #f1f5f9; border-radius: 18px; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.disc-item-card.inactive { opacity: 0.5; background: #f8fafc; filter: grayscale(1); }
.disc-main { padding: 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.disc-left { display: flex; align-items: center; gap: 0.75rem; }
.disc-color-dot { width: 12px; height: 12px; border-radius: 4px; }
.disc-title { font-weight: 700; font-size: 0.95rem; color: #1e293b; }
.disc-right { display: flex; align-items: center; gap: 1rem; }
.caret { font-size: 1rem; color: #94a3b8; transition: transform 0.3s; }
.caret.up { transform: rotate(180deg); }

.disc-expanded { padding: 0 1rem 1.25rem; border-top: 1px solid #f8fafc; animation: slideDown 0.3s ease; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

.config-row { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.row-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
.disc-info-main { display: flex; flex-direction: column; }
.disc-meta-tag { 
    font-size: 0.6rem; font-weight: 800; text-transform: uppercase; 
    color: #94a3b8; margin-top: -2px;
}
.disc-meta-tag.BASIC { color: #10b981; }
.disc-meta-tag.INTERMEDIATE { color: #3b82f6; }
.disc-meta-tag.ADVANCED { color: #a855f7; }

.toggle-group { display: flex; background: #f8fafc; padding: 0.25rem; border-radius: 10px; gap: 0.25rem; }
.toggle-group button { 
    flex: 1; padding: 0.4rem; font-size: 0.7rem; font-weight: 700; border-radius: 8px;
    color: #64748b; transition: all 0.2s;
}
.toggle-group button.active { background: white; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.toggle-group.red button.active { color: #ef4444; }

/* Switches */
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.switch-slider {
  position: absolute; cursor: pointer; inset: 0; background-color: #e2e8f0;
  transition: .3s; border-radius: 34px;
}
.switch-slider:before {
  position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
  background-color: white; transition: .3s; border-radius: 50%;
}
input:checked + .switch-slider { background-color: var(--primary); }
input:checked + .switch-slider:before { transform: translateX(20px); }

.switch-slider.mini { width: 34px; height: 18px; }
.switch-slider.mini:before { height: 12px; width: 12px; left: 3px; bottom: 3px; }
input:checked + .switch-slider.mini:before { transform: translateX(16px); }

/* Animations */
.slide-enter-active, .slide-leave-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { opacity: 0; }
.slide-enter-from .drawer-content { transform: translateX(100%); }
.slide-leave-to .drawer-content { transform: translateX(100%); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
