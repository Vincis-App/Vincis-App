import type { Discipline, ScheduleSettings, ScheduleItem, Proficiency } from './types';

export function generateMonthlySchedule(
    year: number,
    month: number,
    disciplines: Discipline[],
    settings: ScheduleSettings,
    studyLogs: any[]
): Record<number, ScheduleItem[] | null> {
    const schedule: Record<number, ScheduleItem[] | null> = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const activeDisciplines = disciplines.filter(d => d.active !== false);
    if (activeDisciplines.length === 0) return {};

    // Configurações de Ritmo SRS (Manual)
    const paceIntervals = {
        ACCELERATED: [1, 3, 7],
        NORMAL: [1, 7, 14],
        RELAXED: [3, 10, 20]
    };

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();

        // Se não for dia de estudo, marca como descanso
        if (!settings.workDays.includes(dayOfWeek)) {
            schedule[day] = null;
            continue;
        }

        // 1. Calcular Pesos Dinâmicos (Multiplicadores para Equilíbrio)
        // Prioridade Alta = +50%, Baixa = -20%
        // Proficiência Básica = +30%, Avançada = -20%
        const prioritized = activeDisciplines.map(d => {
            let multiplier = 1.0;
            
            // Fator Prioridade
            if (d.priority === 'HIGH') multiplier *= 1.5;
            if (d.priority === 'LOW') multiplier *= 0.8;
            
            // Fator Proficiência (Quanto menor o conhecimento, mais tempo)
            if (d.proficiency === 'BASIC') multiplier *= 1.3;
            if (d.proficiency === 'ADVANCED') multiplier *= 0.8;
            
            const baseWeight = (d.weight || 5);
            const dynamicWeight = baseWeight * multiplier;
            
            return { ...d, dynamicWeight };
        }).sort((a, b) => b.dynamicWeight - a.dynamicWeight);

        // 2. Selecionar Matérias do Dia (Rotação baseada no dia para variedade)
        const offset = (day % activeDisciplines.length);
        const rotated = [...prioritized.slice(offset), ...prioritized.slice(0, offset)];
        const dayDisciplines = rotated.slice(0, settings.maxDisciplinesPerDay);
        
        if (dayDisciplines.length === 0) {
            schedule[day] = [];
            continue;
        }

        // 3. Distribuição Equilibrada (Regra 60/40)
        const totalMinutes = settings.dailyHours * 60;
        const baseMinutesTotal = totalMinutes * 0.6;   // 60% Cobertura Total
        const bonusMinutesTotal = totalMinutes * 0.4;  // 40% Foco em Dificuldade/Prioridade

        const basePerDisc = Math.floor(baseMinutesTotal / dayDisciplines.length);
        const totalDayWeight = dayDisciplines.reduce((acc, d) => acc + d.dynamicWeight, 0);

        schedule[day] = dayDisciplines.map(d => {
            const bonusShare = d.dynamicWeight / totalDayWeight;
            const bonusMinutes = Math.floor(bonusMinutesTotal * bonusShare);
            
            let duration = basePerDisc + bonusMinutes;

            // Arredondamento Usável (múltiplos de 5)
            duration = Math.round(duration / 5) * 5;
            if (duration < 20) duration = 20;

            // 4. Lógica de Revisão (SRS)
            let isReview = false;
            if (settings.srsEnabled) {
                if (settings.srsMode === 'SMART') {
                    // Smart: Frequência baseada na proficiência
                    const freq = d.proficiency === 'BASIC' ? 2 : d.proficiency === 'ADVANCED' ? 5 : 3;
                    isReview = day % freq === 0;
                } else {
                    // Manual: Baseado no ritmo
                    const intervals = paceIntervals[settings.srsPace] || paceIntervals.NORMAL;
                    isReview = intervals.some(interval => day % interval === 0);
                }
            }

            return {
                discipline: d,
                type: isReview ? 'REVIEW' : 'THEORY',
                durationMinutes: duration
            };
        });
    }

    return schedule;
}
