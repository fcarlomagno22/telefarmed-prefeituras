export type ActionIconPalette = {
  iconGradient: readonly [string, string, string]
  shadowColor: string
}

export const ACTION_ICON_PALETTES = {
  schedule: {
    iconGradient: ['#ffb366', '#ff6b00', '#e55f00'],
    shadowColor: 'rgba(255, 107, 0, 0.45)',
  },
  nearbyUnits: {
    iconGradient: ['#fde68a', '#f59e0b', '#d97706'],
    shadowColor: 'rgba(245, 158, 11, 0.4)',
  },
  postConsultation: {
    iconGradient: ['#7dd3fc', '#0ea5e9', '#0284c7'],
    shadowColor: 'rgba(14, 165, 233, 0.38)',
  },
  prescriptions: {
    iconGradient: ['#d8b4fe', '#a855f7', '#9333ea'],
    shadowColor: 'rgba(168, 85, 247, 0.38)',
  },
  myAppointments: {
    iconGradient: ['#6ee7b7', '#10b981', '#059669'],
    shadowColor: 'rgba(16, 185, 129, 0.4)',
  },
  myMetrics: {
    iconGradient: ['#fda4af', '#e11d48', '#be123c'],
    shadowColor: 'rgba(225, 29, 72, 0.4)',
  },
  runWalk: {
    iconGradient: ['#fca5a5', '#ef4444', '#dc2626'],
    shadowColor: 'rgba(239, 68, 68, 0.4)',
  },
  functionalTraining: {
    iconGradient: ['#fdba74', '#f97316', '#ea580c'],
    shadowColor: 'rgba(249, 115, 22, 0.4)',
  },
  eatWell: {
    iconGradient: ['#bef264', '#84cc16', '#4d7c0f'],
    shadowColor: 'rgba(132, 204, 22, 0.38)',
  },
  sleepTime: {
    iconGradient: ['#a5b4fc', '#6366f1', '#4338ca'],
    shadowColor: 'rgba(99, 102, 241, 0.4)',
  },
  mentalHealth: {
    iconGradient: ['#67e8f9', '#0891b2', '#0e7490'],
    shadowColor: 'rgba(8, 145, 178, 0.38)',
  },
  myEmotional: {
    iconGradient: ['#c4b5fd', '#8b5cf6', '#6d28d9'],
    shadowColor: 'rgba(139, 92, 246, 0.38)',
  },
  bible: {
    iconGradient: ['#fde68a', '#d97706', '#b45309'],
    shadowColor: 'rgba(217, 119, 6, 0.42)',
  },
  activeMind: {
    iconGradient: ['#f9a8d4', '#f472b6', '#db2777'],
    shadowColor: 'rgba(244, 114, 182, 0.38)',
  },
  myGoals: {
    iconGradient: ['#93c5fd', '#2563eb', '#1d4ed8'],
    shadowColor: 'rgba(37, 99, 235, 0.38)',
  },
  myRoutine: {
    iconGradient: ['#f0abfc', '#d946ef', '#a21caf'],
    shadowColor: 'rgba(217, 70, 239, 0.38)',
  },
} satisfies Record<string, ActionIconPalette>
