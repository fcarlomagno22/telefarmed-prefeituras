import { getConsultarCrmConfig } from './config.js'
import { mapConsultarCrmRegistro, pickBestConsultarCrmRegistro } from './matchRegistro.js'
import type {
  ConsultarCrmErrorBody,
  ConsultarCrmRegistro,
  ConsultarCrmResolved,
} from './types.js'

const CONSULTAR_CRM_PATH = '/api/v1/crm/consultar'

async function parseConsultarCrmErrorBody(response: Response): Promise<ConsultarCrmErrorBody | null> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null

  try {
    return (await response.json()) as ConsultarCrmErrorBody
  } catch {
    return null
  }
}

export async function consultarCrmPorNome(
  nomeRazaoSocial: string,
): Promise<ConsultarCrmResolved | null> {
  const config = getConsultarCrmConfig()
  const query = nomeRazaoSocial.trim()
  if (!config || !query) return null

  const url = new URL(`${config.baseUrl}${CONSULTAR_CRM_PATH}`)
  url.searchParams.set('nome_razao_social', query)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Token ${config.token}`,
      Accept: 'application/json',
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const body = await parseConsultarCrmErrorBody(response)
    const code = body?.error?.trim() || `HTTP_${response.status}`
    const message =
      body?.message?.trim() ||
      `Falha ao consultar CRM do profissional terceirizado (${response.status}).`

    throw new Error(`[${code}] ${message}`)
  }

  const payload = (await response.json()) as ConsultarCrmRegistro[]
  if (!Array.isArray(payload) || payload.length === 0) return null

  const best = pickBestConsultarCrmRegistro(query, payload)
  if (!best) return null

  return mapConsultarCrmRegistro(best)
}
