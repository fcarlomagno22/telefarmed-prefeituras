/** Tokens visuais do fluxo premium de montagem de escala. */
export const escalaComposeInputClass =
  'w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 ring-1 ring-gray-200/80 outline-none transition placeholder:font-normal placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/25'

export const escalaComposeLabelClass =
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400'

export const escalaComposeCardClass =
  'rounded-2xl bg-white ring-1 ring-gray-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)]'

export const escalaComposeSegmentClass =
  'inline-flex rounded-xl bg-gray-100/90 p-1 ring-1 ring-gray-200/60'

export function escalaComposeSegmentBtn(active: boolean) {
  return [
    'rounded-lg px-4 py-2 text-xs font-bold transition',
    active
      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80'
      : 'text-gray-500 hover:text-gray-800',
  ].join(' ')
}
