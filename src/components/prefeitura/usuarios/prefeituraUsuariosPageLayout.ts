/** Scroll independente por coluna (xl+); em telas menores, rolagem única do bloco. */
export const prefeituraUsuariosColumnScrollClass = [
  'min-h-0 min-w-0',
  'xl:h-full xl:max-h-full',
  'xl:overflow-y-auto xl:overscroll-y-contain',
  'xl:[-ms-overflow-style:none] xl:[scrollbar-width:thin]',
  'xl:[&::-webkit-scrollbar]:w-1.5',
  'xl:[&::-webkit-scrollbar-thumb]:rounded-full',
  'xl:[&::-webkit-scrollbar-thumb]:bg-gray-300',
  'xl:[&::-webkit-scrollbar-track]:bg-transparent',
].join(' ')

/** Coluna esquerda: painel estica na altura da linha do grid. */
export const prefeituraUsuariosMainColumnWrapClass = 'flex h-full min-h-0 min-w-0 flex-col'

/** Coluna direita: altura do conteúdo (rolagem na coluna, não dentro do card). */
export const prefeituraUsuariosSidebarColumnWrapClass = 'min-h-0 min-w-0'

export const prefeituraUsuariosColumnsGridClass = [
  'flex min-h-0 flex-1 flex-col gap-4',
  'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
  'max-xl:[-ms-overflow-style:none] max-xl:[scrollbar-width:thin]',
  'max-xl:[&::-webkit-scrollbar]:w-1.5',
  'max-xl:[&::-webkit-scrollbar-thumb]:rounded-full',
  'max-xl:[&::-webkit-scrollbar-thumb]:bg-gray-300',
  'max-xl:[&::-webkit-scrollbar-track]:bg-transparent',
  'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-1 xl:items-stretch xl:gap-4 xl:overflow-hidden',
].join(' ')
