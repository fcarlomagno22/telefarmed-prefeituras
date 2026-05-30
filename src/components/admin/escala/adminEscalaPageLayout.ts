/** Esquerda: filtros + tabela/lista. Direita: KPIs + painel operacional. */
export const adminEscalaPageGridClass = [
  'flex min-h-0 flex-1 flex-col gap-4',
  'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
  'xl:grid xl:min-h-0 xl:flex-1',
  'xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]',
  'xl:grid-rows-[minmax(0,1fr)_auto]',
  'xl:items-stretch xl:gap-5 xl:overflow-hidden',
].join(' ')

export const adminEscalaMainColumnClass = [
  'flex min-h-0 min-w-0 flex-col gap-3',
  'xl:col-start-1 xl:row-start-1 xl:h-full xl:min-h-0',
].join(' ')

export const adminEscalaSidebarColumnClass = [
  'flex min-h-0 min-w-0 flex-col gap-3',
  'xl:col-start-2 xl:row-start-1 xl:h-full xl:min-h-0',
].join(' ')

export const adminEscalaToolbarSlotClass = 'shrink-0'
export const adminEscalaKpiSlotClass = 'shrink-0'
export const adminEscalaContentSlotClass = 'flex min-h-0 min-w-0 flex-1 flex-col'
export const adminEscalaSidebarPanelSlotClass = 'flex min-h-0 min-w-0 flex-1 flex-col'
