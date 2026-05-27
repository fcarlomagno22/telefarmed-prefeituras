import { panelSurfaceBorderShadowClass } from '../../config/surfaces'

/** Classes compartilhadas pelos 3 cards do topo da página de auditoria. */
export const auditOverviewCardClass = [
  'flex h-full min-h-0 flex-col rounded-2xl p-4',
  panelSurfaceBorderShadowClass,
].join(' ')

export const auditOverviewCardTitleClass = 'text-sm font-bold text-gray-900'

export const auditOverviewCardSubtitleClass = 'mt-0.5 text-[11px] text-gray-500'

export const auditOverviewCardBodyClass = 'mt-3 flex min-h-0 flex-1 flex-col'
