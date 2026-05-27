import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react'
import type { SupportTicketPriority } from '../../data/suporteMock'

export type SupportPriorityOption = {
  value: SupportTicketPriority
  label: string
  icon: LucideIcon
  textClass: string
  activeBorder: string
  activeBg: string
}

export const supportPriorityOptions: SupportPriorityOption[] = [
  {
    value: 'alta',
    label: 'Alta',
    icon: ArrowUp,
    textClass: 'text-red-600',
    activeBorder: 'border-red-300',
    activeBg: 'bg-red-50',
  },
  {
    value: 'media',
    label: 'Média',
    icon: Minus,
    textClass: 'text-amber-600',
    activeBorder: 'border-amber-300',
    activeBg: 'bg-amber-50',
  },
  {
    value: 'baixa',
    label: 'Baixa',
    icon: ArrowDown,
    textClass: 'text-emerald-600',
    activeBorder: 'border-emerald-300',
    activeBg: 'bg-emerald-50',
  },
]

export function getSupportPriorityOption(value: SupportTicketPriority) {
  return supportPriorityOptions.find((opt) => opt.value === value) ?? supportPriorityOptions[1]
}
