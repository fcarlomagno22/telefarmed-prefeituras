import { supabaseAdmin } from '../../db/supabase.js'
import type { RecipientCatalogQuery } from './schemas.js'

export async function listAdminRecipientPrefeituras(query: RecipientCatalogQuery) {
  let dbQuery = supabaseAdmin
    .from('entidades_contratantes')
    .select('id, nome_exibicao, municipio, uf')
    .in('status_cliente', ['ativa', 'suspensa', 'implantacao', 'sem_contrato'])
    .order('nome_exibicao', { ascending: true })

  if (query.uf) dbQuery = dbQuery.eq('uf', query.uf.toUpperCase())
  if (query.municipality) dbQuery = dbQuery.eq('id', query.municipality)
  if (query.prefeituraId) dbQuery = dbQuery.eq('id', query.prefeituraId)

  const { data, error } = await dbQuery
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.nome_exibicao),
    municipality: String(row.municipio),
    uf: String(row.uf),
    regionKey: 'centro',
  }))
}

export async function listAdminRecipientUbts(query: RecipientCatalogQuery) {
  let dbQuery = supabaseAdmin
    .from('unidades_ubt')
    .select('id, nome, entidade_contratante_id, entidades_contratantes(nome_exibicao, municipio, uf)')
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  if (query.prefeituraId) dbQuery = dbQuery.eq('entidade_contratante_id', query.prefeituraId)
  if (query.municipality) dbQuery = dbQuery.eq('entidade_contratante_id', query.municipality)
  if (query.unidadeId) dbQuery = dbQuery.eq('id', query.unidadeId)

  const { data, error } = await dbQuery
  if (error) throw error

  return (data ?? [])
    .filter((row) => {
      const entidade = row.entidades_contratantes as { uf?: string } | null
      if (query.uf && entidade?.uf !== query.uf.toUpperCase()) return false
      return true
    })
    .map((row) => {
      const entidade = row.entidades_contratantes as {
        nome_exibicao?: string
        municipio?: string
        uf?: string
      } | null

      return {
        id: String(row.id),
        name: String(row.nome),
        prefeituraId: String(row.entidade_contratante_id),
        prefeituraName: String(entidade?.nome_exibicao ?? ''),
        municipality: String(entidade?.municipio ?? ''),
        uf: String(entidade?.uf ?? ''),
        regionKey: 'centro',
      }
    })
}

export async function listAdminRecipientPrefeituraUsers(query: RecipientCatalogQuery) {
  let dbQuery = supabaseAdmin
    .from('usuarios_prefeitura')
    .select('id, nome, nivel_acesso, entidade_contratante_id, entidades_contratantes(nome_exibicao, municipio, uf)')
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  if (query.prefeituraId) dbQuery = dbQuery.eq('entidade_contratante_id', query.prefeituraId)
  if (query.municipality) dbQuery = dbQuery.eq('entidade_contratante_id', query.municipality)

  const { data, error } = await dbQuery
  if (error) throw error

  const search = query.search?.trim().toLowerCase()

  return (data ?? [])
    .filter((row) => {
      const entidade = row.entidades_contratantes as { uf?: string; nome_exibicao?: string } | null
      if (query.uf && entidade?.uf !== query.uf.toUpperCase()) return false
      if (!search) return true
      const haystack = [row.nome, entidade?.nome_exibicao].join(' ').toLowerCase()
      return haystack.includes(search)
    })
    .map((row) => {
      const entidade = row.entidades_contratantes as {
        nome_exibicao?: string
        municipio?: string
        uf?: string
      } | null

      return {
        id: String(row.id),
        name: String(row.nome),
        role: 'Gestor municipal',
        accessLevel: String(row.nivel_acesso),
        prefeituraId: String(row.entidade_contratante_id),
        prefeituraName: String(entidade?.nome_exibicao ?? ''),
        municipality: String(entidade?.municipio ?? ''),
        uf: String(entidade?.uf ?? ''),
      }
    })
}

export async function listAdminRecipientUbtUsers(query: RecipientCatalogQuery) {
  let dbQuery = supabaseAdmin
    .from('usuarios_ubt')
    .select(
      'id, nome, eh_responsavel_ubt, unidade_ubt_id, entidade_contratante_id, unidades_ubt(nome), entidades_contratantes(nome_exibicao, municipio, uf)',
    )
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  if (query.prefeituraId) dbQuery = dbQuery.eq('entidade_contratante_id', query.prefeituraId)
  if (query.municipality) dbQuery = dbQuery.eq('entidade_contratante_id', query.municipality)
  if (query.unidadeId) dbQuery = dbQuery.eq('unidade_ubt_id', query.unidadeId)

  const { data, error } = await dbQuery
  if (error) throw error

  const search = query.search?.trim().toLowerCase()

  return (data ?? [])
    .filter((row) => {
      const entidade = row.entidades_contratantes as { uf?: string } | null
      if (query.uf && entidade?.uf !== query.uf.toUpperCase()) return false
      if (!search) return true
      const unit = row.unidades_ubt as { nome?: string } | null
      const haystack = [row.nome, unit?.nome].join(' ').toLowerCase()
      return haystack.includes(search)
    })
    .map((row) => {
      const entidade = row.entidades_contratantes as {
        nome_exibicao?: string
        municipio?: string
        uf?: string
      } | null
      const unit = row.unidades_ubt as { nome?: string } | null

      return {
        id: String(row.id),
        name: String(row.nome),
        role: row.eh_responsavel_ubt ? 'Responsável UBT' : 'Operador',
        isUnitResponsible: Boolean(row.eh_responsavel_ubt),
        unidadeId: String(row.unidade_ubt_id),
        unidadeName: String(unit?.nome ?? ''),
        prefeituraId: String(row.entidade_contratante_id),
        prefeituraName: String(entidade?.nome_exibicao ?? ''),
        municipality: String(entidade?.municipio ?? ''),
        uf: String(entidade?.uf ?? ''),
      }
    })
}

export async function listAdminRecipientProfissionais(query: RecipientCatalogQuery) {
  let dbQuery = supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome, especialidade, conselho_numero, conselho_uf')
    .eq('status', 'ativo')
    .order('nome', { ascending: true })

  if (query.specialty?.trim()) {
    dbQuery = dbQuery.ilike('especialidade', query.specialty.trim())
  }

  const { data, error } = await dbQuery
  if (error) throw error

  const search = query.search?.trim().toLowerCase()

  return (data ?? [])
    .filter((row) => {
      if (!search) return true
      const haystack = [row.nome, row.especialidade, row.conselho_numero, row.conselho_uf]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
    .map((row) => ({
      id: String(row.id),
      name: String(row.nome),
      specialty: String(row.especialidade || 'Sem especialidade'),
      councilRegistration: row.conselho_numero
        ? `${String(row.conselho_numero)}${row.conselho_uf ? `-${String(row.conselho_uf)}` : ''}`
        : null,
    }))
}

export async function getAdminRecipientProfissionaisStats() {
  const { data: ativos, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, especialidade')
    .eq('status', 'ativo')

  if (error) throw error

  const { data: plantaoRows, error: plantaoError } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('profissional_id')
    .eq('status', 'confirmado')

  if (plantaoError) throw plantaoError

  const emPlantao = new Set((plantaoRows ?? []).map((row) => String(row.profissional_id)))
  const bySpecialty = new Map<string, number>()

  for (const row of ativos ?? []) {
    const specialty = String(row.especialidade || 'Sem especialidade')
    bySpecialty.set(specialty, (bySpecialty.get(specialty) ?? 0) + 1)
  }

  return {
    totalAtivos: ativos?.length ?? 0,
    emPlantao: emPlantao.size,
    especialidades: Array.from(bySpecialty.entries()).map(([name, activeCount], index) => ({
      id: `esp-${index}`,
      name,
      activeCount,
    })),
  }
}
