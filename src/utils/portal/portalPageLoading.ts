/** Skeleton bloqueante só na primeira carga (sem dados em cache). */
export function shouldBlockPortalQuery(isPending: boolean, hasCachedData: boolean): boolean {
  return isPending && !hasCachedData
}

/** Mantém conteúdo em tela durante refresh em background (stale-while-revalidate). */
export function shouldShowPortalPageLoadingBlock(
  isLoading: boolean,
  hasCachedContent: boolean,
): boolean {
  return isLoading && !hasCachedContent
}

/**
 * @deprecated Use `shouldBlockPortalQuery` com React Query (`isPending` + `data`).
 */
export function shouldBlockPortalPageWithCache(_cacheKey: string): boolean {
  return true
}
