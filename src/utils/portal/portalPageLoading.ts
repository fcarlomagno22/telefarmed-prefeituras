import { hasPortalPageCache } from './portalPageCache'

/** Skeleton bloqueante só na primeira carga (sem cache de sessão). */
export function shouldBlockPortalPageWithCache(cacheKey: string): boolean {
  return !hasPortalPageCache(cacheKey)
}

/** Mantém conteúdo em tela durante refresh em background (stale-while-revalidate). */
export function shouldShowPortalPageLoadingBlock(isLoading: boolean, hasCachedContent: boolean): boolean {
  return isLoading && !hasCachedContent
}
