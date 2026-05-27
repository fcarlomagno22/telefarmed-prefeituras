/** Área rolável de tabelas nos cards do monitor operacional. */
export const monitorCardTableScrollClass = [
  'min-h-0 overflow-x-auto overflow-y-auto overscroll-y-contain',
  'max-h-[min(14rem,30vh)]',
  '[-ms-overflow-style:none] [scrollbar-width:thin]',
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-gray-300',
  '[&::-webkit-scrollbar-track]:bg-transparent',
].join(' ')

export const monitorOngoingTableScrollClass = [
  'min-h-0 overflow-x-auto overflow-y-auto overscroll-y-contain',
  'max-h-[min(16rem,32vh)]',
  '[-ms-overflow-style:none] [scrollbar-width:thin]',
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-gray-300',
  '[&::-webkit-scrollbar-track]:bg-transparent',
].join(' ')

export const monitorTableHeadStickyClass = 'sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm'
