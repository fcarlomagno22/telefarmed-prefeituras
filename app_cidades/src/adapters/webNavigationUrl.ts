export type { WebNavigationHistoryEntry, WebNavigationLocation } from './webNavigationUrl.types'
export {
  buildMinimalWebRouteUrl,
  buildNavigationUrl,
  parseMinimalWebRouteFromCurrentUrl,
  parseMinimalWebRouteFromUrl,
  parseNavigationFromCurrentUrl,
  parseNavigationFromUrl,
  readNavigationEntryFromHistoryState,
} from './webNavigationUrl.native'
