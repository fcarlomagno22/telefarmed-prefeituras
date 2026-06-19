import type { AppointmentStatus } from '../../data/agendaMock'

export type AgendaStatusStyle = {
  label: string
  rowBg: [number, number, number]
  timeColor: [number, number, number]
  statusText: [number, number, number]
  accent: [number, number, number]
  initialsBg: [number, number, number]
  initialsText: [number, number, number]
  /** Gradiente da linha inferior da tag (esq → dir), igual ao card */
  badgeGradient: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ]
  /** Cor do brilho abaixo da linha (simula shadow da tag) */
  badgeGlow: [number, number, number]
}

/** Largura fixa da tag — equivalente a w-[9rem] no card */
export const AGENDA_STATUS_BADGE_WIDTH_PT = 108
export const AGENDA_STATUS_BADGE_HEIGHT_PT = 26
export const AGENDA_STATUS_BADGE_LINE_PT = 3

export const agendaStatusStyles: Record<AppointmentStatus, AgendaStatusStyle> = {
  realizado: {
    label: 'Realizado',
    rowBg: [236, 253, 245],
    timeColor: [4, 120, 87],
    statusText: [4, 120, 87],
    accent: [16, 185, 129],
    initialsBg: [209, 250, 229],
    initialsText: [4, 120, 87],
    badgeGradient: [
      [52, 211, 153],
      [16, 185, 129],
      [20, 184, 166],
    ],
    badgeGlow: [16, 185, 129],
  },
  em_atendimento: {
    label: 'Em atendimento',
    rowBg: [240, 249, 255],
    timeColor: [2, 132, 199],
    statusText: [3, 105, 161],
    accent: [59, 130, 246],
    initialsBg: [224, 242, 254],
    initialsText: [3, 105, 161],
    badgeGradient: [
      [56, 189, 248],
      [59, 130, 246],
      [99, 102, 241],
    ],
    badgeGlow: [59, 130, 246],
  },
  aguardando: {
    label: 'Aguardando',
    rowBg: [255, 251, 235],
    timeColor: [217, 119, 6],
    statusText: [180, 83, 9],
    accent: [245, 158, 11],
    initialsBg: [254, 243, 199],
    initialsText: [180, 83, 9],
    badgeGradient: [
      [253, 224, 71],
      [251, 191, 36],
      [245, 158, 11],
    ],
    badgeGlow: [245, 158, 11],
  },
  agendado: {
    label: 'Agendado',
    rowBg: [255, 255, 255],
    timeColor: [17, 24, 39],
    statusText: [75, 85, 99],
    accent: [156, 163, 175],
    initialsBg: [243, 244, 246],
    initialsText: [55, 65, 81],
    badgeGradient: [
      [209, 213, 219],
      [156, 163, 175],
      [100, 116, 139],
    ],
    badgeGlow: [100, 116, 139],
  },
  faltou: {
    label: 'Faltou',
    rowBg: [254, 242, 242],
    timeColor: [220, 38, 38],
    statusText: [220, 38, 38],
    accent: [239, 68, 68],
    initialsBg: [254, 226, 226],
    initialsText: [185, 28, 28],
    badgeGradient: [
      [251, 113, 133],
      [239, 68, 68],
      [220, 38, 38],
    ],
    badgeGlow: [239, 68, 68],
  },
}
