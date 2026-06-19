import { API_BASE_URL } from '../config'

export type IcdSearchResult = {
  code: string
  title: string
  uri?: string
}

export type IcdSearchResponse = {
  configured: boolean
  results: IcdSearchResult[]
  error?: string
}

export async function searchIcdReference(query: string, limit = 8): Promise<IcdSearchResponse> {
  const params = new URLSearchParams({
    q: query.trim(),
    limit: String(limit),
  })

  const response = await fetch(`${API_BASE_URL}/reference/icd/search?${params.toString()}`)
  const payload = (await response.json().catch(() => null)) as IcdSearchResponse | { error?: string } | null

  if (!response.ok) {
    return {
      configured: Boolean((payload as IcdSearchResponse | null)?.configured),
      results: [],
      error:
        (payload as { error?: string } | null)?.error
        ?? 'Não foi possível buscar CID na OMS.',
    }
  }

  return {
    configured: Boolean((payload as IcdSearchResponse).configured),
    results: (payload as IcdSearchResponse).results ?? [],
    error: (payload as IcdSearchResponse).error,
  }
}
