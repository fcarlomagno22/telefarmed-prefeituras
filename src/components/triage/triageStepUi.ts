export const triageInputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

export const triageInputErrorClass =
  'w-full rounded-xl border border-red-300 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-200/60'

export const triageLabelClass = 'mb-1.5 block text-sm font-medium text-gray-700'

export const triageSectionTitleClass = 'text-sm font-semibold text-gray-900'

export const triageChipClass = (selected: boolean) =>
  `rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
    selected
      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20'
      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50'
  }`

export const triageHintClass = 'text-xs text-gray-500'

export const triageNotMeasuredButtonClass = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
    active
      ? 'border-gray-300 bg-gray-100 text-gray-700'
      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
  }`

export const triageRangeInputClass = 'triage-range-input'

export function triageRangeProgressStyle(
  value: number,
  min = 0,
  max = 10,
): { '--range-progress': string } {
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100
  return { '--range-progress': `${percent}%` }
}
