import { ConsultationDocumentKind } from '../types/appointmentDocuments'
import { colors } from './colors'

export type ConsultationDocumentPalette = {
  iconGradient: readonly [string, string, string]
  shadowColor: string
  iconTint: string
  cardBorder: string
  cardBackground: string
  cardGradient: readonly [string, string, string]
  sectionLabel: string
  tagBackground: string
  tagBorder: string
  tagText: string
}

const white = colors.cardBg

export const CONSULTATION_DOCUMENT_PALETTES: Record<
  ConsultationDocumentKind,
  ConsultationDocumentPalette
> = {
  exam: {
    iconGradient: ['#0284c7', '#0ea5e9', '#38bdf8'],
    shadowColor: 'rgba(14, 165, 233, 0.45)',
    iconTint: '#38bdf8',
    cardBorder: 'rgba(14, 165, 233, 0.16)',
    cardBackground: white,
    cardGradient: [white, white, 'rgba(14, 165, 233, 0.06)'],
    sectionLabel: '#0369a1',
    tagBackground: 'rgba(14, 165, 233, 0.12)',
    tagBorder: 'rgba(14, 165, 233, 0.24)',
    tagText: '#0369a1',
  },
  prescription: {
    iconGradient: ['#059669', '#10b981', '#34d399'],
    shadowColor: 'rgba(16, 185, 129, 0.45)',
    iconTint: '#34d399',
    cardBorder: 'rgba(16, 185, 129, 0.16)',
    cardBackground: white,
    cardGradient: [white, white, 'rgba(16, 185, 129, 0.06)'],
    sectionLabel: '#047857',
    tagBackground: 'rgba(16, 185, 129, 0.12)',
    tagBorder: 'rgba(16, 185, 129, 0.24)',
    tagText: '#047857',
  },
  certificate: {
    iconGradient: ['#d97706', '#f59e0b', '#fbbf24'],
    shadowColor: 'rgba(245, 158, 11, 0.45)',
    iconTint: '#fbbf24',
    cardBorder: 'rgba(245, 158, 11, 0.16)',
    cardBackground: white,
    cardGradient: [white, white, 'rgba(245, 158, 11, 0.06)'],
    sectionLabel: '#b45309',
    tagBackground: 'rgba(245, 158, 11, 0.12)',
    tagBorder: 'rgba(245, 158, 11, 0.24)',
    tagText: '#b45309',
  },
}

export function getDocumentsConsultationCardColors(featured = false) {
  return {
    cardGradient: featured
      ? ([white, white, 'rgba(168, 85, 247, 0.08)'] as const)
      : ([white, white, 'rgba(168, 85, 247, 0.06)'] as const),
    cardBorder: featured ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.16)',
    tagBackground: 'rgba(168, 85, 247, 0.12)',
    tagBorder: 'rgba(168, 85, 247, 0.24)',
    tagText: '#7c3aed',
  }
}
