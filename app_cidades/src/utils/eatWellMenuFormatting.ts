import type { EatWellSavedMenu } from '../types/eatWell'
import { getMenuObjectiveLabel } from './eatWellMenuWizard'

export function formatEatWellMenuCreatedAt(iso: string): string {
  const date = new Date(iso)
  const datePart = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${datePart} · ${timePart}`
}

export function formatEatWellMenuSubtitle(menu: EatWellSavedMenu): string {
  return `${getMenuObjectiveLabel(menu.objective)} · ${formatEatWellMenuCreatedAt(menu.createdAt)}`
}
