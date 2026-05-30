import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'

export const configPanelShellClass = [
  'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl',
  'border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

export const configInputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

export const configSubTabsClass =
  'flex shrink-0 flex-wrap gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3 sm:px-5'

export const configSubTabButtonClass = (active: boolean) =>
  [
    'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
    active
      ? 'bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-gray-200'
      : 'text-gray-600 hover:bg-white/80 hover:text-gray-900',
  ].join(' ')

export const configStatusBadgeClass = (active: boolean) =>
  [
    'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
    active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600',
  ].join(' ')

export const configCatalogStatusBadgeConfig: Record<'ativo' | 'inativo', SituationStatusBadgeStyle> =
  {
    ativo: {
      label: 'Ativo',
      text: 'text-emerald-700',
      accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
      lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
    },
    inativo: {
      label: 'Inativo',
      text: 'text-red-700',
      accent: 'bg-gradient-to-r from-red-400 via-rose-500 to-orange-500',
      lineGlow: 'shadow-[0_2px_10px_rgba(248,113,113,0.55)]',
    },
  }

export const configCatalogStatusBadgeWidth = 'w-[6.75rem]'

export const configCatalogTableShellClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200'

export const configCatalogTableScrollClass = 'min-h-0 flex-1 overflow-y-auto overscroll-contain'

export const configCatalogTableClass = 'w-full text-left text-sm'

export const configCatalogTableHeadClass =
  'sticky top-0 z-10 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 shadow-[inset_0_-1px_0_rgb(229,231,235)]'

export const configPanelBodyClass = 'flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6'

export const configPanelSectionClass = 'flex min-h-0 flex-1 flex-col gap-4'

export const configPanelFooterClass =
  'flex shrink-0 justify-end border-t border-gray-100 pt-4'
