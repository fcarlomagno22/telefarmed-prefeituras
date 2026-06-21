import { supabaseAdmin } from '../../db/supabase.js'
import { UbtRh3Error } from './errors.js'

export const MT_IMMEDIATE_DEFAULT_PROFESSIONAL = {
  nome: 'Nobuaki Gozi',
  conselhoSigla: 'CRM',
  conselhoNumero: '12989',
  conselhoUf: 'SP',
} as const

export async function resolveMtImmediateDefaultProfissionalId(): Promise<string> {
  const { conselhoSigla, conselhoNumero, conselhoUf, nome } = MT_IMMEDIATE_DEFAULT_PROFESSIONAL

  const { data: byConselho, error: conselhoError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id')
    .eq('conselho_sigla', conselhoSigla)
    .eq('conselho_numero', conselhoNumero)
    .eq('conselho_uf', conselhoUf)
    .eq('status', 'ativo')
    .maybeSingle()

  if (conselhoError) throw conselhoError
  if (byConselho?.id) return String(byConselho.id)

  const { data: byName, error: nameError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id')
    .ilike('nome', nome)
    .eq('status', 'ativo')
    .maybeSingle()

  if (nameError) throw nameError
  if (byName?.id) return String(byName.id)

  throw new UbtRh3Error(
    'Profissional padrão de teleconsulta imediata (Nobuaki Gozi) não encontrado no cadastro.',
    'MT_IMMEDIATE_PROFESSIONAL_NOT_FOUND',
    500,
  )
}
