import { colors } from '../../theme/colors'

/** Fundo do painel fullscreen de relatórios (tema claro). */
export const REPORT_SHEET_GRADIENT = [colors.backgroundElevated, '#f0f0f2'] as const

/** Substituições comuns de estilos pensados para tema escuro. */
export const reportDrawerChrome = {
  sheetBorder: colors.surfaceBorder,
  closeButtonBg: colors.surface,
  headerOrbBorder: 'rgba(255, 255, 255, 0.35)',
  cardBg: colors.backgroundElevated,
  cardBgMuted: colors.surface,
  divider: colors.surfaceBorder,
} as const
