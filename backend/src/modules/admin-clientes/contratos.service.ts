import { supabaseAdmin } from '../../db/supabase.js'
import { resolveContratoModalidade } from './contratoModalidade.js'
import {
  mapContratoRow,
  type ContratoRow,
  type EspecialidadeAutorizadaRow,
  type PrecoEspecialidadeRow,
  type PrecoProfissaoRow,
} from './formatters.js'
import type { AdminClienteContratoDto } from './types.js'

export type ContratosBundle = {
  contratosByEntidade: Map<string, AdminClienteContratoDto[]>
}

function groupByContratoId<T extends { contrato_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const current = map.get(row.contrato_id) ?? []
    current.push(row)
    map.set(row.contrato_id, current)
  }
  return map
}

export async function loadContratosBundleForEntidades(
  entidadeIds: string[],
): Promise<ContratosBundle> {
  if (entidadeIds.length === 0) {
    return { contratosByEntidade: new Map() }
  }

  const [contratosResult, tiposResult] = await Promise.all([
    supabaseAdmin
      .from('contratos_entidade')
      .select(
        'id, entidade_contratante_id, numero, tipo, status, data_assinatura, data_encerramento, consultas_contratadas, consultas_realizadas, percentual_utilizado, permite_ultrapassar, aceita_pacientes_outros_municipios',
      )
      .in('entidade_contratante_id', entidadeIds)
      .order('data_assinatura', { ascending: false }),
    supabaseAdmin.from('config_tipos_contrato').select('id, nome'),
  ])

  if (contratosResult.error) throw contratosResult.error
  if (tiposResult.error) throw tiposResult.error

  const modalidadeByTipo = new Map(
    (tiposResult.data ?? []).map((row) => [
      String(row.id),
      resolveContratoModalidade(String(row.id), String(row.nome)),
    ]),
  )

  const contratos = (contratosResult.data ?? []) as ContratoRow[]
  const contratosByEntidade = new Map<string, AdminClienteContratoDto[]>(
    entidadeIds.map((id) => [id, []]),
  )

  if (contratos.length === 0) {
    return { contratosByEntidade }
  }

  const contratoIds = contratos.map((row) => row.id)

  const [especialidadesResult, precosProfissaoResult, precosEspecialidadeResult] = await Promise.all([
    supabaseAdmin
      .from('contrato_entidade_especialidades')
      .select('contrato_id, especialidade_id')
      .in('contrato_id', contratoIds),
    supabaseAdmin
      .from('contrato_entidade_precos_profissao')
      .select('contrato_id, profissao_id, tipo, valor_consulta_centavos')
      .in('contrato_id', contratoIds),
    supabaseAdmin
      .from('contrato_entidade_precos_especialidade')
      .select('contrato_id, especialidade_id, tipo, valor_consulta_centavos')
      .in('contrato_id', contratoIds),
  ])

  if (especialidadesResult.error) throw especialidadesResult.error
  if (precosProfissaoResult.error) throw precosProfissaoResult.error
  if (precosEspecialidadeResult.error) throw precosEspecialidadeResult.error

  const especialidadesByContrato = groupByContratoId(
    (especialidadesResult.data ?? []) as EspecialidadeAutorizadaRow[],
  )
  const precosProfissaoByContrato = groupByContratoId(
    (precosProfissaoResult.data ?? []) as PrecoProfissaoRow[],
  )
  const precosEspecialidadeByContrato = groupByContratoId(
    (precosEspecialidadeResult.data ?? []) as PrecoEspecialidadeRow[],
  )

  for (const contrato of contratos) {
    const mapped = mapContratoRow(
      contrato,
      especialidadesByContrato.get(contrato.id) ?? [],
      precosProfissaoByContrato.get(contrato.id) ?? [],
      precosEspecialidadeByContrato.get(contrato.id) ?? [],
      modalidadeByTipo.get(contrato.tipo) ?? resolveContratoModalidade(contrato.tipo),
    )

    const current = contratosByEntidade.get(contrato.entidade_contratante_id) ?? []
    current.push(mapped)
    contratosByEntidade.set(contrato.entidade_contratante_id, current)
  }

  return { contratosByEntidade }
}

export async function loadContratosForEntidade(
  entidadeId: string,
): Promise<AdminClienteContratoDto[]> {
  const bundle = await loadContratosBundleForEntidades([entidadeId])
  return bundle.contratosByEntidade.get(entidadeId) ?? []
}
