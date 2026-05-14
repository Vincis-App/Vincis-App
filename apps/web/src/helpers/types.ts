export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
export type Proficiency = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

export interface Discipline {
  id: number
  name: string
  color: string
  weight: number
  active?: boolean
  priority?: Priority
  proficiency?: Proficiency | number
  topics?: any[]
}

export interface ScheduleSettings {
  dailyHours: number
  workDays: number[]
  maxDisciplinesPerDay: number
  startDate: string
  endDate?: string
  srsEnabled: boolean
  srsMode: 'SMART' | 'MANUAL'
  srsPace: 'ACCELERATED' | 'NORMAL' | 'RELAXED'
}

export interface ScheduleItem {
  discipline: Discipline
  type: 'THEORY' | 'REVIEW'
  durationMinutes: number
}
