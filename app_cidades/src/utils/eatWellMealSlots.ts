import type { MaterialCommunityIcons } from '@expo/vector-icons'
import type { MealSlot } from '../types/eatWell'

export type MealSlotConfig = {
  slot: MealSlot
  label: string
  shortLabel: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  suggestedTime: string
  color: string
  donutColor: string
}

export const MEAL_SLOT_ORDER: MealSlot[] = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'basket',
  'off_schedule',
]

export const MEAL_SLOT_CONFIG: Record<MealSlot, MealSlotConfig> = {
  breakfast: {
    slot: 'breakfast',
    label: 'Café da manhã',
    shortLabel: 'Café',
    icon: 'coffee-outline',
    suggestedTime: '07:30',
    color: '#fbbf24',
    donutColor: '#f59e0b',
  },
  morning_snack: {
    slot: 'morning_snack',
    label: 'Lanche da manhã',
    shortLabel: 'Lanche AM',
    icon: 'baguette',
    suggestedTime: '10:00',
    color: '#fcd34d',
    donutColor: '#eab308',
  },
  lunch: {
    slot: 'lunch',
    label: 'Almoço',
    shortLabel: 'Almoço',
    icon: 'food-variant',
    suggestedTime: '12:30',
    color: '#34d399',
    donutColor: '#10b981',
  },
  afternoon_snack: {
    slot: 'afternoon_snack',
    label: 'Lanche da tarde',
    shortLabel: 'Lanche PM',
    icon: 'fruit-cherries',
    suggestedTime: '15:30',
    color: '#f472b6',
    donutColor: '#ec4899',
  },
  dinner: {
    slot: 'dinner',
    label: 'Jantar',
    shortLabel: 'Jantar',
    icon: 'moon-waning-crescent',
    suggestedTime: '19:30',
    color: '#818cf8',
    donutColor: '#6366f1',
  },
  basket: {
    slot: 'basket',
    label: 'Cesta',
    shortLabel: 'Cesta',
    icon: 'basket-outline',
    suggestedTime: '—',
    color: '#a3e635',
    donutColor: '#84cc16',
  },
  off_schedule: {
    slot: 'off_schedule',
    label: 'Imprevisto',
    shortLabel: 'Imprev.',
    icon: 'lightning-bolt-outline',
    suggestedTime: '—',
    color: '#c084fc',
    donutColor: '#a855f7',
  },
}

export function getMealSlotConfig(slot: MealSlot): MealSlotConfig {
  return MEAL_SLOT_CONFIG[slot]
}

export function formatMealTime(iso: string | null | undefined, fallback: string) {
  if (!iso) return fallback
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return fallback
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
