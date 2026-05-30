/** Lista + sidebar analítica larga (xl+), mesma altura na viewport. */
export const profissionalAtendimentosColumnScrollClass = [
  'min-h-0 min-w-0',
  'xl:h-full xl:max-h-full',
  'xl:overflow-y-auto xl:overscroll-y-contain',
  'xl:[-ms-overflow-style:none] xl:[scrollbar-width:thin]',
  'xl:[&::-webkit-scrollbar]:w-1.5',
  'xl:[&::-webkit-scrollbar-thumb]:rounded-full',
  'xl:[&::-webkit-scrollbar-thumb]:bg-gray-300',
  'xl:[&::-webkit-scrollbar-track]:bg-transparent',
].join(' ')

export const profissionalAtendimentosColumnsGridClass = [
  'flex min-h-0 flex-1 flex-col gap-4',
  'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
  'max-xl:[-ms-overflow-style:none] max-xl:[scrollbar-width:thin]',
  'max-xl:[&::-webkit-scrollbar]:w-1.5',
  'max-xl:[&::-webkit-scrollbar-thumb]:rounded-full',
  'max-xl:[&::-webkit-scrollbar-thumb]:bg-gray-300',
  'max-xl:[&::-webkit-scrollbar-track]:bg-transparent',
  'xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] xl:grid-rows-1 xl:items-stretch xl:gap-5 xl:overflow-hidden',
].join(' ')

export const profissionalAtendimentosColumnFillClass = 'flex h-full min-h-0 min-w-0 flex-col'
