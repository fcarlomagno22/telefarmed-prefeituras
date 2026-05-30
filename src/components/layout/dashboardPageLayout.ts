/** Shell da página dentro do DashboardLayout — viewport fixa, conteúdo rola abaixo do header. */
export const dashboardPageShellClass = 'flex h-full min-h-0 flex-col overflow-hidden'

export const dashboardPageHeaderWrapClass = 'shrink-0 px-5 pt-5 sm:px-8 sm:pt-6 lg:px-10'

export const dashboardPageScrollAreaClass = [
  'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain',
  '[-ms-overflow-style:none] [scrollbar-width:thin]',
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-gray-300',
  '[&::-webkit-scrollbar-track]:bg-transparent',
].join(' ')

export const dashboardPageScrollPaddingClass = 'px-5 pb-5 sm:px-8 sm:pb-6 lg:px-10'

export const dashboardPageContentStackClass = 'flex flex-col gap-4'

/** Coluna principal + sidebar (320px); mesma altura na linha (xl+). */
export const dashboardTwoColumnLayoutClass = [
  'flex flex-col gap-4',
  'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-1 xl:items-stretch xl:gap-4',
].join(' ')

/** Grid de cards do dashboard / monitor municipal (altura estável por linha). */
export const prefeituraDashboardCardsRowClass = 'grid grid-cols-1 items-stretch gap-4'

/** Monitor operacional — grade 2 colunas com cards de altura fixa na linha. */
export const prefeituraMonitorGridClass =
  'grid shrink-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-stretch'

/** Card/painel principal com altura mínima estável. */
export const dashboardMainPanelSurfaceClass = [
  'flex shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

export const dashboardMainPanelMinHeightClass = 'min-h-[28rem]'

export const dashboardSidebarAsideClass = 'flex shrink-0 flex-col gap-4'

/** Corpo da página Agenda — no desktop preenche até o footer; no mobile pode rolar a página. */
export const agendaPageBodyClass = [
  'mt-4 flex min-h-0 flex-1 flex-col pb-5',
  'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
  'xl:overflow-hidden',
].join(' ')

/** Grade principal + sidebar; a coluna central estica até o footer. */
export const agendaTwoColumnLayoutClass = [
  'flex min-h-0 flex-1 flex-col gap-4',
  'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-1 xl:items-stretch xl:gap-4',
].join(' ')

export const agendaMainColumnClass = [
  'flex min-h-0 min-w-0 flex-col',
  'max-xl:min-h-[min(32rem,calc(100dvh-14rem))]',
  'xl:h-full xl:min-h-0 xl:flex-1',
].join(' ')

export const agendaSidebarColumnClass =
  'flex min-h-0 min-w-0 flex-col self-stretch xl:h-full xl:overflow-hidden'

/** Área rolável padrão das páginas internas. */
export const dashboardPageFillScrollAreaClass = [
  'min-h-0 min-w-0 flex-1 overflow-hidden',
  'flex flex-col',
].join(' ')

/** Agenda profissional — header/tabs fixos; colunas rolam de forma independente (xl+). */
export const profissionalAgendaBodyClass = 'mt-4 flex min-h-0 flex-1 flex-col pb-5'

export const profissionalAgendaGridClass = [
  'grid w-full min-w-0 grid-cols-1 gap-4',
  'xl:grid-cols-[minmax(0,1fr)_minmax(14rem,16rem)] xl:items-start',
].join(' ')

export const profissionalAgendaMainColumnClass = 'flex w-full min-w-0 flex-col gap-4'

export const profissionalAgendaSidebarColumnClass = [
  'flex w-full min-w-0 flex-col gap-3',
  'xl:sticky xl:top-0 xl:self-start',
].join(' ')
