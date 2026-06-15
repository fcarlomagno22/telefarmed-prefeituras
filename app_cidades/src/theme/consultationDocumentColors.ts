import { ConsultationDocumentKind } from '../types/appointmentDocuments'

export type ConsultationDocumentPalette = {
  iconGradient: readonly [string, string, string]
  shadowColor: string
  iconTint: string
  cardBorder: string
  cardBackground: string
  sectionLabel: string
}

export const CONSULTATION_DOCUMENT_PALETTES: Record<
  ConsultationDocumentKind,
  ConsultationDocumentPalette
> = {
  exam: {
    iconGradient: ['#0284c7', '#0ea5e9', '#38bdf8'],
    shadowColor: 'rgba(14, 165, 233, 0.45)',
    iconTint: '#38bdf8',
    cardBorder: 'rgba(56, 189, 248, 0.28)',
    cardBackground: 'rgba(14, 165, 233, 0.08)',
    sectionLabel: '#7dd3fc',
  },
  prescription: {
    iconGradient: ['#059669', '#10b981', '#34d399'],
    shadowColor: 'rgba(16, 185, 129, 0.45)',
    iconTint: '#34d399',
    cardBorder: 'rgba(52, 211, 153, 0.28)',
    cardBackground: 'rgba(16, 185, 129, 0.08)',
    sectionLabel: '#6ee7b7',
  },
  certificate: {
    iconGradient: ['#d97706', '#f59e0b', '#fbbf24'],
    shadowColor: 'rgba(245, 158, 11, 0.45)',
    iconTint: '#fbbf24',
    cardBorder: 'rgba(251, 191, 36, 0.28)',
    cardBackground: 'rgba(245, 158, 11, 0.1)',
    sectionLabel: '#fcd34d',
  },
}
