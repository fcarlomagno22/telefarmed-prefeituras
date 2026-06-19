import { brand } from './brand'

export const DOCUMENT_TITLE_SUFFIX = 'Saúde Conectada'

export function resolveDocumentTitle(displayName?: string | null): string {
  const name = displayName?.trim() || brand.appName
  return `${name} | ${DOCUMENT_TITLE_SUFFIX}`
}
