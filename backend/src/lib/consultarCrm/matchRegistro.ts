import type { ConsultarCrmRegistro, ConsultarCrmResolved } from './types.js'

function normalizePersonName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function isMedicoCategoria(categoria: string): boolean {
  return normalizePersonName(categoria).includes('medico')
}

function scoreNameMatch(queryName: string, candidateName: string): number {
  const query = normalizePersonName(queryName)
  const candidate = normalizePersonName(candidateName)

  if (!query || !candidate) return 0
  if (query === candidate) return 100_000

  const queryTokens = query.split(' ').filter(Boolean)
  const candidateTokens = candidate.split(' ').filter(Boolean)
  const candidateSet = new Set(candidateTokens)

  const matchedTokens = queryTokens.filter((token) => candidateSet.has(token)).length
  if (matchedTokens === 0) return 0

  const allQueryMatched = matchedTokens === queryTokens.length
  const extraTokens = Math.max(0, candidateTokens.length - matchedTokens)

  let score = matchedTokens * 100
  if (allQueryMatched) score += 500
  score -= extraTokens * 25

  if (candidate.includes(query) || query.includes(candidate)) {
    score += 50
  }

  return score
}

export function pickBestConsultarCrmRegistro(
  queryName: string,
  registros: ConsultarCrmRegistro[],
): ConsultarCrmRegistro | null {
  if (registros.length === 0) return null

  const medicos = registros.filter((item) => isMedicoCategoria(item.categoria))
  const pool = medicos.length > 0 ? medicos : registros

  let best: ConsultarCrmRegistro | null = null
  let bestScore = -1

  for (const item of pool) {
    const score = scoreNameMatch(queryName, item.nome_razao_social)
    if (score > bestScore) {
      best = item
      bestScore = score
    }
  }

  return best
}

export function mapConsultarCrmRegistro(
  registro: ConsultarCrmRegistro,
): ConsultarCrmResolved | null {
  const conselhoNumero = registro.numero_registro.replace(/\D/g, '').trim()
  const conselhoUf = registro.uf.trim().toUpperCase()

  if (!conselhoNumero || conselhoUf.length !== 2) return null

  return {
    conselhoSigla: 'CRM',
    conselhoNumero,
    conselhoUf,
    nomeRazaoSocial: registro.nome_razao_social.trim(),
  }
}
