import { supabaseAdmin } from '../../db/supabase.js'
import { CredenciaisError } from './errors.js'
import { listUbtOptionsByEntity } from '../admin-credenciais/referencias.service.js'

export async function getPrefeituraEntitySummary(entidadeId: string) {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, razao_social, municipio, uf, status')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.status !== 'ativo') {
    throw new CredenciaisError('Entidade contratante não encontrada.', 'NOT_FOUND', 404)
  }

  const municipality = String(data.municipio)
  const uf = String(data.uf)

  return {
    id: String(data.id),
    razaoSocial: String(data.razao_social),
    municipality,
    uf,
    label: `${municipality} · ${uf}`,
  }
}

export async function listPrefeituraUbtOptions(entidadeId: string) {
  return listUbtOptionsByEntity(entidadeId)
}
