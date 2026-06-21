import { requireRh3Config } from './config.js'
import { Rh3ApiError } from './errors.js'
import type {
  Rh3AuthResponse,
  Rh3CreateElegibilidadInput,
  Rh3CreateInvitacionInput,
  Rh3CreateInvitacionResponse,
  Rh3CreatePacienteInput,
  Rh3CreatePacienteResponse,
  Rh3ListEspecialidadesResponse,
  Rh3ProviderErrorBody,
  Rh3ScheduleAppointmentInput,
  Rh3ScheduleAppointmentResponse,
  Rh3ScheduleAvailabilityFilter,
  Rh3ScheduleAvailabilityResponse,
  Rh3TurnoDetailsResponse,
} from './types.js'

export { getRh3Config, isRh3Configured, requireRh3Config } from './config.js'
export { Rh3ApiError, isRh3ApiError } from './errors.js'
export type * from './types.js'

let tokenCache: { token: string; expiresAtMs: number } | null = null

export function sanitizeRh3Document(value: string): string {
  return value.replace(/\D/g, '')
}

function buildRh3Url(path: string): string {
  const { baseUrl } = requireRh3Config()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

async function parseRh3ErrorBody(response: Response): Promise<Rh3ProviderErrorBody | null> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null

  try {
    return (await response.json()) as Rh3ProviderErrorBody
  } catch {
    return null
  }
}

async function throwRh3HttpError(response: Response): Promise<never> {
  const body = await parseRh3ErrorBody(response)
  const message =
    body?.mensaje?.trim() ||
    `Falha na integração RH3 (HTTP ${response.status}).`

  throw new Rh3ApiError(message, {
    code: body?.codigo,
    statusCode: response.status,
    payload: body,
  })
}

async function rh3Authenticate(forceRefresh = false): Promise<string> {
  if (!forceRefresh && tokenCache && Date.now() < tokenCache.expiresAtMs - 60_000) {
    return tokenCache.token
  }

  const { clientId, clientSecret } = requireRh3Config()
  const response = await fetch(buildRh3Url('/v2/authentication'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    await throwRh3HttpError(response)
  }

  const payload = (await response.json()) as Rh3AuthResponse
  if (!payload.token?.trim()) {
    throw new Rh3ApiError('Token RH3 indisponível na resposta de autenticação.')
  }

  const expiresAtMs =
    typeof payload.exp === 'number' && Number.isFinite(payload.exp)
      ? payload.exp * 1000
      : Date.now() + 55 * 60_000

  tokenCache = {
    token: payload.token,
    expiresAtMs,
  }

  return payload.token
}

type Rh3RequestOptions = {
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  body?: unknown
  auth?: boolean
  allowNotFound?: boolean
}

async function rh3Request<T>(options: Rh3RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.auth !== false) {
    headers.Authorization = `Bearer ${await rh3Authenticate()}`
  }

  const response = await fetch(buildRh3Url(options.path), {
    method: options.method,
    headers,
    body: options.body == null ? undefined : JSON.stringify(options.body),
  })

  if (options.allowNotFound && response.status === 404) {
    return undefined as T
  }

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      tokenCache = null
      headers.Authorization = `Bearer ${await rh3Authenticate(true)}`
      const retry = await fetch(buildRh3Url(options.path), {
        method: options.method,
        headers,
        body: options.body == null ? undefined : JSON.stringify(options.body),
      })
      if (!retry.ok) {
        await throwRh3HttpError(retry)
      }
      return parseRh3SuccessBody<T>(retry)
    }

    await throwRh3HttpError(response)
  }

  return parseRh3SuccessBody<T>(response)
}

async function parseRh3SuccessBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  const raw = await response.text()
  if (!raw.trim()) {
    return undefined as T
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(raw) as T
  }

  return raw as T
}

export async function rh3CreatePaciente(
  input: Rh3CreatePacienteInput,
): Promise<Rh3CreatePacienteResponse> {
  return rh3Request<Rh3CreatePacienteResponse>({
    method: 'POST',
    path: '/v2/paciente',
    body: {
      id_tipo_de_identificacion: '2',
      id_pais: 'BR',
      tag_idioma: 'PT',
      guest: 1,
      ...input,
      valor_identificacion: sanitizeRh3Document(input.valor_identificacion),
    },
  })
}

export async function rh3CreateElegibilidad(
  input: Rh3CreateElegibilidadInput,
): Promise<unknown> {
  const afiliado = {
    plan: 'premium',
    ...input.afiliado,
    nro_documento: sanitizeRh3Document(input.afiliado.nro_documento),
    credencial: sanitizeRh3Document(input.afiliado.credencial),
    nro_documento_titular: sanitizeRh3Document(input.afiliado.nro_documento_titular),
  }

  return rh3Request({
    method: 'POST',
    path: '/v2/portal/elegibilidad',
    body: { afiliado },
  })
}

export async function rh3DeleteElegibilidad(cpf: string): Promise<void> {
  const document = sanitizeRh3Document(cpf)
  await rh3Request({
    method: 'DELETE',
    path: `/v2/portal/elegibilidad/${document}`,
    allowNotFound: true,
  })
}

export async function rh3CreateInvitacion(
  input: Rh3CreateInvitacionInput,
): Promise<Rh3CreateInvitacionResponse> {
  const response = await rh3Request<Rh3CreateInvitacionResponse>({
    method: 'POST',
    path: '/v2/invitacion',
    body: {
      id_tipo_de_identificacion: '9',
      id_motivo_consulta: '9999999',
      ...input,
      valor_identificacion: sanitizeRh3Document(input.valor_identificacion),
    },
  })

  if (!response.data?.url_email?.trim()) {
    throw new Rh3ApiError('Resposta RH3 sem url_email para convite de teleconsulta.', {
      payload: response,
    })
  }

  return response
}

export async function rh3ListEspecialidades(
  language = 'PT',
): Promise<Rh3ListEspecialidadesResponse> {
  return rh3Request<Rh3ListEspecialidadesResponse>({
    method: 'GET',
    path: `/v2/especialidades/${encodeURIComponent(language)}`,
  })
}

export async function rh3GetScheduleAvailability(
  idEspecialidad: number | string,
  filter: Rh3ScheduleAvailabilityFilter = {},
): Promise<Rh3ScheduleAvailabilityResponse> {
  const filterJson = JSON.stringify(filter)
  return rh3Request<Rh3ScheduleAvailabilityResponse>({
    method: 'GET',
    path: `/v2/schedule/availability-anonymous/${encodeURIComponent(String(idEspecialidad))}/${encodeURIComponent(filterJson)}`,
  })
}

export async function rh3ScheduleAppointment(
  input: Rh3ScheduleAppointmentInput,
): Promise<Rh3ScheduleAppointmentResponse> {
  return rh3Request<Rh3ScheduleAppointmentResponse>({
    method: 'POST',
    path: '/v2/schedule',
    body: {
      id_motivo_consulta: '9999999',
      ...input,
      paciente: {
        id_tipo_de_identificacion: 9,
        id_pais: 'BR',
        ...input.paciente,
        valor_identificacion: sanitizeRh3Document(input.paciente.valor_identificacion),
      },
    },
  })
}

export async function rh3GetTurno(idTurno: number | string): Promise<Rh3TurnoDetailsResponse> {
  return rh3Request<Rh3TurnoDetailsResponse>({
    method: 'GET',
    path: `/v2/turno/${encodeURIComponent(String(idTurno))}`,
  })
}

export async function rh3CancelTurno(idTurno: number | string): Promise<void> {
  await rh3Request({
    method: 'DELETE',
    path: `/v2/turno/${encodeURIComponent(String(idTurno))}`,
  })
}

export function clearRh3TokenCache(): void {
  tokenCache = null
}
