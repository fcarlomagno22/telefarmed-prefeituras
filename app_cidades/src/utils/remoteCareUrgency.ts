import type { RemoteCareUrgencyLevel } from '../types/remoteCareRequest'

export type RemoteCareUrgencyOption = {
  id: RemoteCareUrgencyLevel
  label: string
  hint: string
  icon: 'leaf-outline' | 'time-outline' | 'alert-circle-outline'
}

export const REMOTE_CARE_URGENCY_OPTIONS: RemoteCareUrgencyOption[] = [
  {
    id: 'routine',
    label: 'Rotina',
    hint: 'Posso aguardar alguns dias para ser atendido(a)',
    icon: 'leaf-outline',
  },
  {
    id: 'moderate',
    label: 'Moderada',
    hint: 'Preciso de atendimento em breve, mas sem risco imediato',
    icon: 'time-outline',
  },
  {
    id: 'high',
    label: 'Alta',
    hint: 'Situação que não pode esperar muito — prioridade na análise',
    icon: 'alert-circle-outline',
  },
]

export function getRemoteCareUrgencyLabel(level: RemoteCareUrgencyLevel): string {
  return REMOTE_CARE_URGENCY_OPTIONS.find((item) => item.id === level)?.label ?? 'Moderada'
}
