import type { ActivityModality } from '../types/auth'

export const ACTIVITY_MODALITY_LABELS: Record<ActivityModality, string> = {
  walk: 'Caminhada',
  'active-walk': 'Caminhada ativa',
  run: 'Corrida',
  'run-walk': 'Corrida e caminhada',
  treadmill: 'Esteira',
  free: 'Atividade livre',
}

export type ModalityDefaults = {
  activityName: string
  intensity: string
  durationMinutes: number
}

export const MODALITY_DEFAULTS: Record<ActivityModality, ModalityDefaults> = {
  walk: {
    activityName: 'Caminhada tranquila',
    intensity: 'Leve',
    durationMinutes: 30,
  },
  'active-walk': {
    activityName: 'Caminhada ativa',
    intensity: 'Moderada',
    durationMinutes: 35,
  },
  run: {
    activityName: 'Corrida contínua',
    intensity: 'Moderada',
    durationMinutes: 25,
  },
  'run-walk': {
    activityName: 'Corrida e caminhada',
    intensity: 'Confortável',
    durationMinutes: 30,
  },
  treadmill: {
    activityName: 'Esteira',
    intensity: 'Moderada',
    durationMinutes: 30,
  },
  free: {
    activityName: 'Atividade livre',
    intensity: 'Personalizada',
    durationMinutes: 30,
  },
}

export type ModalityOption = {
  id: ActivityModality
  label: string
  subtitle: string
  icon: 'walk' | 'run-fast' | 'run' | 'home-variant' | 'lightning-bolt'
}

export const MODALITY_OPTIONS: ModalityOption[] = [
  {
    id: 'walk',
    label: ACTIVITY_MODALITY_LABELS.walk,
    subtitle: 'Ritmo leve, ideal para aquecer ou relaxar',
    icon: 'walk',
  },
  {
    id: 'active-walk',
    label: ACTIVITY_MODALITY_LABELS['active-walk'],
    subtitle: 'Passo mais firme para elevar a frequência cardíaca',
    icon: 'walk',
  },
  {
    id: 'run',
    label: ACTIVITY_MODALITY_LABELS.run,
    subtitle: 'Corrida contínua no seu ritmo',
    icon: 'run-fast',
  },
  {
    id: 'run-walk',
    label: ACTIVITY_MODALITY_LABELS['run-walk'],
    subtitle: 'Alternância guiada entre corrida e caminhada',
    icon: 'run',
  },
  {
    id: 'treadmill',
    label: ACTIVITY_MODALITY_LABELS.treadmill,
    subtitle: 'Treino indoor com controle de velocidade',
    icon: 'home-variant',
  },
  {
    id: 'free',
    label: ACTIVITY_MODALITY_LABELS.free,
    subtitle: 'Sem estrutura fixa — você define o percurso',
    icon: 'lightning-bolt',
  },
]
