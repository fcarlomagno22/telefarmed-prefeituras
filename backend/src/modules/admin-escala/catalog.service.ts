import { supabaseAdmin } from '../../db/supabase.js'
import { formatContratoStatusLabel, formatUbtStatus } from './formatters.js'
import type { EscalaCatalogDto } from './types.js'

export async function getEscalaCatalog(): Promise<EscalaCatalogDto> {
  const [doctorsResult, prefeiturasResult, ubtsResult, specialtiesResult] = await Promise.all([
    supabaseAdmin
      .from('vw_admin_profissionais_ativos')
      .select('id, nome, especialidade_nome, status')
      .eq('status', 'ativo')
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from('entidades_contratantes')
      .select('id, nome_exibicao, razao_social, municipio, uf, status_cliente')
      .in('status_cliente', ['ativa', 'implantacao', 'suspensa', 'sem_contrato'])
      .order('nome_exibicao', { ascending: true }),
    supabaseAdmin
      .from('unidades_ubt')
      .select(
        'id, nome, ra_rotulo, ra_chave, status, entidade_contratante_id, entidades_contratantes!inner(municipio, nome_exibicao, razao_social)',
      )
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from('config_especialidades')
      .select('id, nome, ativo')
      .order('nome', { ascending: true }),
  ])

  if (doctorsResult.error) throw doctorsResult.error
  if (prefeiturasResult.error) throw prefeiturasResult.error
  if (ubtsResult.error) throw ubtsResult.error
  if (specialtiesResult.error) throw specialtiesResult.error

  return {
    doctors: (doctorsResult.data ?? []).map((row) => ({
      value: String(row.id),
      label: String(row.nome),
      specialty: String(row.especialidade_nome ?? ''),
    })),
    prefeituras: (prefeiturasResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.nome_exibicao || row.razao_social),
      municipio: String(row.municipio),
      uf: String(row.uf),
      status: String(row.status_cliente),
    })),
    ubts: (ubtsResult.data ?? []).map((row) => {
      const entidade = row.entidades_contratantes as unknown as {
        municipio: string
        nome_exibicao: string
        razao_social: string
      }
      const municipalityName = String(entidade?.nome_exibicao || entidade?.razao_social || entidade?.municipio || '')
      return {
        id: String(row.id),
        name: String(row.nome),
        municipalityId: String(row.entidade_contratante_id),
        municipalityName,
        region: String(row.ra_rotulo ?? ''),
        regionKey: String(row.ra_chave ?? ''),
        status: formatUbtStatus(String(row.status)),
      }
    }),
    specialties: (specialtiesResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.nome),
      active: Boolean(row.ativo),
    })),
  }
}

export { formatContratoStatusLabel }
