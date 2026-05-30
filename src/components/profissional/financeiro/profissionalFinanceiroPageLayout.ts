/** Corpo da página Financeiro — preenche a viewport no desktop. */
export const profissionalFinanceiroBodyClass = [
  'mt-4 flex min-h-0 flex-1 flex-col pb-5',
  'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
  'xl:overflow-hidden',
].join(' ')

/**
 * Duas colunas (xl+): esquerda nav + hero + plantões; direita previsão + histórico.
 * Plantões começa logo abaixo do hero, na mesma coluna.
 */
export const profissionalFinanceiroGridClass = [
  'flex min-h-0 min-w-0 flex-1 flex-col gap-4',
  'xl:grid xl:min-h-0 xl:flex-1',
  'xl:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)]',
  'xl:grid-rows-1 xl:items-stretch xl:gap-x-5 xl:overflow-hidden',
].join(' ')

export const profissionalFinanceiroMainColumnClass = [
  'flex min-h-0 min-w-0 flex-col gap-4',
  'xl:h-full xl:min-h-0 xl:overflow-hidden',
].join(' ')

export const profissionalFinanceiroSidebarColumnClass = [
  'flex min-h-0 min-w-0 flex-col gap-4',
  'xl:h-full xl:min-h-0 xl:overflow-hidden',
].join(' ')

/** Plantões — preenche o restante da coluna esquerda abaixo do hero. */
export const profissionalFinanceiroShiftsCellClass = 'flex min-h-0 min-w-0 flex-1 flex-col'

/** Histórico — preenche o restante da coluna direita abaixo da previsão. */
export const profissionalFinanceiroHistoryCellClass = 'flex min-h-0 min-w-0 flex-1 flex-col'
