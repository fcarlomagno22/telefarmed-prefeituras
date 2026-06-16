export type RunWalkTab = 'today' | 'progress'

export type RunWalkActivityType = 'walk' | 'run-walk' | 'run'

export type RunWalkIntensity = 'light' | 'comfortable' | 'moderate'

export type RunWalkActivityStep = {
  label: string
}

export type TodayActivity = {
  id: string
  title: string
  type: RunWalkActivityType
  durationMinutes: number
  intensity: RunWalkIntensity
  intensityLabel: string
  goal: string
  structure: RunWalkActivityStep[]
  estimatedDistanceKm: number
  recommendedPace: string
  terrain: string
  audioGuidance: boolean
  warmup: string
  cooldown: string
  importantCautions: string[]
}

export type DispositionLevel = 'good' | 'moderate' | 'low' | 'rest'

export type DispositionFactor = {
  id: string
  label: string
  value: string
  considered: boolean
}

export type DispositionState = {
  level: DispositionLevel
  message: string
  factors: DispositionFactor[]
}

export type WeeklyGoalStats = {
  completedActivities: number
  targetActivities: number
  activeMinutes: number
  targetActiveMinutes: number
  movementDays: number
  targetMovementDays: number
}

export type WeeklyGoalTargets = {
  targetActivities: number
  targetActiveMinutes: number
  targetMovementDays: number
}

export type WeeklyCalendarActivityType =
  | 'walk'
  | 'run'
  | 'run-walk'
  | 'strength'
  | 'mobility'
  | 'rest'
  | 'free'

export type WeeklyCalendarActivity = {
  type: WeeklyCalendarActivityType
  label: string
  completed?: boolean
}

export type WeeklyCalendarDay = {
  dateIso: string
  dayLabel: string
  weekdayShort: string
  dateShort?: string
  isToday: boolean
  isFuture?: boolean
  activeMinutes: number
  activities: WeeklyCalendarActivity[]
}

export type TodayActivityPresetId =
  | 'quick-activity'
  | 'light-walk'
  | 'active-walk'
  | 'recovery-walk'
  | 'beginner-run-walk'
  | 'easy-run'

export type TodayActivityPreset = {
  id: TodayActivityPresetId
  title: string
  subtitle: string
  level: 'simple' | 'moderate' | 'advanced'
  activity: TodayActivity
}

export type RunWalkQuickShortcutId = 'start-activity' | 'nearby-routes'

export type ActivityMenuAction =
  | 'later'
  | 'reschedule'
  | 'tomorrow'
  | 'swap-walk'
  | 'reduce-duration'
  | 'reduce-intensity'
  | 'free-activity'
  | 'report-tired'
  | 'report-discomfort'
  | 'skip'
  | 'remove-today'

export type DispositionMood = 'great' | 'good' | 'tired' | 'very-tired' | 'discomfort'

export type DispositionCheckinAnswers = {
  mood: DispositionMood
  sleptWell?: boolean
  hasPain?: boolean
  lowEnergy?: boolean
  preferLighter?: boolean
  preferWalkOverRun?: boolean
}

export type DispositionRecommendation =
  | 'keep'
  | 'slower-pace'
  | 'reduce-time'
  | 'swap-walk'
  | 'light-walk'
  | 'recovery'
  | 'rest'

export type RunWalkTodayState = {
  activity: TodayActivity
  disposition: DispositionState
  weeklyGoal: WeeklyGoalStats
  weeklyCalendar: WeeklyCalendarDay[]
}
