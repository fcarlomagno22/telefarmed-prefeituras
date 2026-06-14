import { reportCategories } from '../../config/reportsCategories'

/** Corpo da página Relatórios (UBT) — preenche até o footer no desktop. */
export const relatoriosPageBodyClass = [
  'mt-4 flex min-h-0 flex-1 flex-col pb-5',
  'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
  'xl:overflow-hidden',
].join(' ')

/** Grade da página principal de relatórios (hub) — layout em cards. */
export const relatoriosContentGridClass = [
  'grid gap-4',
  'xl:grid-cols-[minmax(0,1fr)_320px]',
  'xl:grid-rows-[auto_auto_auto]',
  'xl:items-stretch',
].join(' ')

/** Grade da página principal de relatórios (hub) — layout em lista com altura fixa. */
export const relatoriosContentGridListClass = [
  'grid min-h-0 flex-1 gap-4',
  'xl:grid-cols-[minmax(0,1fr)_320px]',
  'xl:grid-rows-1',
  'xl:items-stretch',
].join(' ')

export const relatoriosCategoryGridClass = [
  'grid min-h-0 flex-1 grid-cols-1 gap-3',
  'sm:grid-cols-2 sm:auto-rows-fr',
  'xl:grid-cols-3 xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]',
].join(' ')

export const relatoriosCategoryListClass = [
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

export const REPORT_CATEGORY_CARD_COUNT = reportCategories.length
