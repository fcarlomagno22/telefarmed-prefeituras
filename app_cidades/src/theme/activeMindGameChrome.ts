import { colors } from './colors'

/** Shared chrome for Ativa Mente game screens (light theme). */
export const activeMindGameChrome = {
  tileBackground: colors.backgroundElevated,
  /** Opaque white panel for Sudoku board / intro card. */
  sudokuCardBackground: colors.cardBg,
  tileBorder: colors.surfaceBorder,
  controlBackground: colors.backgroundElevated,
  actionLink: '#0e7490',
  actionWarm: '#b45309',
} as const
