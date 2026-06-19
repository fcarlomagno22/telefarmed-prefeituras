import { env } from '../../config/env.js'

export type IcdSearchResult = {
  code: string
  title: string
  uri?: string
}

type WhoTokenResponse = {
  access_token: string
  expires_in: number
}

type WhoSearchEntity = {
  theCode?: string
  code?: string
  title?: string | { '@value'?: string }
  id?: string
}

type WhoSearchResponse = {
  destinationEntities?: WhoSearchEntity[]
  errorMessage?: string
}

let tokenCache: { token: string; expiresAt: number } | null = null

function readWhoCredentials() {
  const clientId = env.WHO_ICD_CLIENT_ID?.trim()
  const clientSecret = env.WHO_ICD_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

function stripHtmlMarkup(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeEntityTitle(title: WhoSearchEntity['title']): string {
  if (!title) return ''
  const raw = typeof title === 'string' ? title : String(title['@value'] ?? '')
  return stripHtmlMarkup(raw)
}

function normalizeEntityCode(entity: WhoSearchEntity): string {
  return String(entity.theCode ?? entity.code ?? '').trim()
}

async function fetchWhoAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token
  }

  const response = await fetch('https://icdaccessmanagement.who.int/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'icdapi_access',
      grant_type: 'client_credentials',
    }),
  })

  if (!response.ok) {
    throw new Error('Falha ao autenticar na API ICD da OMS.')
  }

  const payload = (await response.json()) as WhoTokenResponse
  if (!payload.access_token) {
    throw new Error('Token da API ICD da OMS indisponível.')
  }

  tokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(payload.expires_in - 30, 60) * 1000,
  }

  return payload.access_token
}

function resolveSearchEndpoint(query: string): string {
  const trimmed = query.trim()
  const looksLikeCid10Code = /^[A-Za-z]\d{2}(\.\d{1,2})?$/.test(trimmed)

  if (looksLikeCid10Code) {
    return 'https://id.who.int/icd/release/10/2019/en/search'
  }

  return 'https://id.who.int/icd/release/11/2024-01/mms/search'
}

export function isWhoIcdApiConfigured(): boolean {
  return readWhoCredentials() !== null
}

export async function searchWhoIcd(query: string, limit = 8): Promise<IcdSearchResult[]> {
  const credentials = readWhoCredentials()
  if (!credentials) {
    throw new Error('API ICD da OMS não configurada no servidor.')
  }

  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const token = await fetchWhoAccessToken(credentials.clientId, credentials.clientSecret)
  const endpoint = resolveSearchEndpoint(trimmed)
  const url = new URL(endpoint)

  url.searchParams.set('q', trimmed)
  url.searchParams.set('useFlexisearch', 'true')
  url.searchParams.set('flatResults', 'true')
  url.searchParams.set('highlighting', 'false')

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Accept-Language': 'pt',
      'API-Version': 'v2',
    },
  })

  if (!response.ok) {
    throw new Error('Não foi possível consultar a API ICD da OMS.')
  }

  const payload = (await response.json()) as WhoSearchResponse
  const entities = payload.destinationEntities ?? []

  const seen = new Set<string>()
  const results: IcdSearchResult[] = []

  for (const entity of entities) {
    const code = normalizeEntityCode(entity)
    const title = normalizeEntityTitle(entity.title)
    if (!code || !title) continue

    const key = code.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    results.push({
      code,
      title,
      uri: entity.id,
    })

    if (results.length >= limit) break
  }

  return results
}
