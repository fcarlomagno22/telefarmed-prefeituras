const profissionalAgendaColumnScrollBaseClass = [
  'min-h-0 min-w-0 w-full',
  'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
  'max-xl:[-ms-overflow-style:none] max-xl:[scrollbar-width:thin]',
  'max-xl:[&::-webkit-scrollbar]:w-1.5',
  'max-xl:[&::-webkit-scrollbar-thumb]:rounded-full',
  'max-xl:[&::-webkit-scrollbar-thumb]:bg-gray-300',
  'max-xl:[&::-webkit-scrollbar-track]:bg-transparent',
  'xl:h-full xl:max-h-full',
].join(' ')

/** Coluna principal — altura fixa no xl+ para o calendário preencher a célula. */
export const profissionalAgendaMainColumnScrollClass = [
  profissionalAgendaColumnScrollBaseClass,
  'xl:overflow-hidden',
].join(' ')

/** Sidebar — rolagem independente no xl+. */
export const profissionalAgendaSidebarColumnScrollClass = [
  profissionalAgendaColumnScrollBaseClass,
  'xl:overflow-y-auto xl:overscroll-y-contain',
  'xl:[-ms-overflow-style:none] xl:[scrollbar-width:thin]',
  'xl:[&::-webkit-scrollbar]:w-1.5',
  'xl:[&::-webkit-scrollbar-thumb]:rounded-full',
  'xl:[&::-webkit-scrollbar-thumb]:bg-gray-300',
  'xl:[&::-webkit-scrollbar-track]:bg-transparent',
].join(' ')

/** @deprecated Use profissionalAgendaMainColumnScrollClass ou profissionalAgendaSidebarColumnScrollClass */
export const profissionalAgendaColumnScrollClass = profissionalAgendaMainColumnScrollClass

/** Coluna principal + sidebar escalam juntas com a largura da viewport. */
export const profissionalAgendaColumnsGridClass = [
  'grid w-full min-h-0 min-w-0 flex-1 grid-cols-1 gap-4',
  'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
  'max-xl:[-ms-overflow-style:none] max-xl:[scrollbar-width:thin]',
  'max-xl:[&::-webkit-scrollbar]:w-1.5',
  'max-xl:[&::-webkit-scrollbar-thumb]:rounded-full',
  'max-xl:[&::-webkit-scrollbar-thumb]:bg-gray-300',
  'max-xl:[&::-webkit-scrollbar-track]:bg-transparent',
  'xl:grid-cols-[minmax(0,1fr)_minmax(17rem,22%)] xl:grid-rows-1 xl:items-stretch xl:gap-4 xl:overflow-hidden',
  '2xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24%)]',
].join(' ')

/** Calendário e plantões do dia dividem a altura disponível (xl+). */
export const profissionalAgendaMainColumnFillClass = [
  'grid w-full min-w-0 min-h-0 flex-1 gap-4',
  'max-xl:auto-rows-auto',
  'xl:h-full xl:min-h-0 xl:grid-rows-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:overflow-hidden',
].join(' ')

export const profissionalAgendaSidebarColumnFillClass =
  'flex h-full w-full min-w-0 flex-col gap-3 xl:gap-4'
