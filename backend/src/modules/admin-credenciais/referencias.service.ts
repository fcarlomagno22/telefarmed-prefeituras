import { supabaseAdmin } from '../../db/supabase.js'
import type { ContractingEntityOptionDto, CredenciaisKpisDto, UbtOptionDto } from './types.js'

export async function getCredenciaisKpis(): Promise<CredenciaisKpisDto> {
  const { data, error } = await supabaseAdmin.from('vw_credenciais_kpis').select('*').single()
  if (error) throw error

  return {
    internosTotal: Number(data.internos_total ?? 0),
    prefeituraTotal: Number(data.prefeitura_total ?? 0),
    ubtTotal: Number(data.ubt_total ?? 0),
    ativosRedeTotal: Number(data.ativos_rede_total ?? 0),
  }
}

export async function listContractingEntities(): Promise<ContractingEntityOptionDto[]> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, razao_social, municipio, uf')
    .eq('status', 'ativo')
    .order('municipio', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: String(row.id),
    razaoSocial: String(row.razao_social),
    municipality: String(row.municipio),
    uf: String(row.uf),
    label: `${row.razao_social} · ${row.municipio}/${row.uf}`,
  }))
}

export async function listUbtOptionsByEntity(entityId: string): Promise<UbtOptionDto[]> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id, nome, ra_chave, ra_rotulo, entidade_contratante_id')
    .eq('entidade_contratante_id', entityId)
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    value: String(row.id),
    label: String(row.nome),
    ubtName: String(row.nome),
    raKey: String(row.ra_chave),
    raLabel: String(row.ra_rotulo),
    contractingEntityId: String(row.entidade_contratante_id),
  }))
}

export async function listAllActiveUbtOptions(): Promise<UbtOptionDto[]> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id, nome, ra_chave, ra_rotulo, entidade_contratante_id')
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    value: String(row.id),
    label: String(row.nome),
    ubtName: String(row.nome),
    raKey: String(row.ra_chave),
    raLabel: String(row.ra_rotulo),
    contractingEntityId: String(row.entidade_contratante_id),
  }))
}
