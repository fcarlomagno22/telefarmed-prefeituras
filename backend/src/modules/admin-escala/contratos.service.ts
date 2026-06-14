import { supabaseAdmin } from '../../db/supabase.js'
import { loadContratosBundleForEntidades } from '../admin-clientes/contratos.service.js'
import { EscalaError } from './errors.js'
import { formatContratoStatusLabel } from './formatters.js'
import type { ContratosBody } from './schemas.js'
import type { EscalaContratoOptionDto } from './types.js'

const OPERATIONAL_CONTRATO_STATUS = ['ativo', 'implantacao'] as const

export async function listEscalaContratos(
  params: ContratosBody,
): Promise<EscalaContratoOptionDto[]> {
  let entidadeIds: string[] = []

  if (params.prefeituraScope.mode === 'selected') {
    entidadeIds = params.prefeituraScope.prefeituraIds
    if (entidadeIds.length === 0) {
      throw new EscalaError('Selecione ao menos uma prefeitura.', 'INVALID_DATA', 400)
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from('entidades_contratantes')
      .select('id')
      .in('status_cliente', ['ativa', 'implantacao', 'suspensa', 'sem_contrato'])

    if (error) throw error
    entidadeIds = (data ?? []).map((row) => String(row.id))
  }

  if (entidadeIds.length === 0) return []

  const [entidadesResult, bundle, tiposResult] = await Promise.all([
    supabaseAdmin
      .from('entidades_contratantes')
      .select('id, nome_exibicao, razao_social')
      .in('id', entidadeIds),
    loadContratosBundleForEntidades(entidadeIds),
    supabaseAdmin.from('config_tipos_contrato').select('id, nome'),
  ])

  if (entidadesResult.error) throw entidadesResult.error
  if (tiposResult.error) throw tiposResult.error

  const entidadeNameById = new Map(
    (entidadesResult.data ?? []).map((row) => [
      String(row.id),
      String(row.nome_exibicao || row.razao_social),
    ]),
  )
  const tipoLabelById = new Map(
    (tiposResult.data ?? []).map((row) => [String(row.id), String(row.nome)]),
  )

  const specialtyFilter = new Set(params.specialtyIds ?? [])
  const options: EscalaContratoOptionDto[] = []

  for (const entidadeId of entidadeIds) {
    const contratos = bundle.contratosByEntidade.get(entidadeId) ?? []
    const entidadeNome = entidadeNameById.get(entidadeId) ?? 'Entidade'

    for (const contrato of contratos) {
      if (!OPERATIONAL_CONTRATO_STATUS.includes(contrato.status as (typeof OPERATIONAL_CONTRATO_STATUS)[number])) {
        continue
      }

      const especialidadesAutorizadas = contrato.detalhes?.especialidadesAutorizadas ?? []
      if (
        specialtyFilter.size > 0 &&
        !especialidadesAutorizadas.some((id) => specialtyFilter.has(id))
      ) {
        continue
      }

      const tipoLabel = tipoLabelById.get(contrato.tipo) ?? contrato.tipo
      const numero = contrato.numero ?? null
      options.push({
        id: contrato.id,
        entidadeContratanteId: entidadeId,
        entidadeNome,
        numero,
        tipo: contrato.tipo,
        tipoLabel,
        status: contrato.status,
        statusLabel: formatContratoStatusLabel(contrato.status),
        dataAssinatura: contrato.dataAssinatura,
        dataEncerramento: contrato.dataEncerramento ?? null,
        especialidadesAutorizadas,
        label: `${entidadeNome} · ${numero ?? contrato.id.slice(0, 8)}`,
      })
    }
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}
