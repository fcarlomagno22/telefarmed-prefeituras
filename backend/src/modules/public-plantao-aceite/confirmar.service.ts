import { supabaseAdmin } from '../../db/supabase.js'
import { appPublicUrls } from '../../config/appUrls.js'
import { normalizeCpf } from '../../lib/cpf.js'
import { loadProfissionalEscalaContext } from '../profissional-escala/context.service.js'
import { PublicPlantaoAceiteError } from './errors.js'
import { resolveConviteByToken } from './convite.service.js'
import { inscreverProfissionalEscalaSlot } from '../profissional-escala/inscrever.service.js'
import type { ConfirmarPlantaoAceiteResultDto } from './types.js'

async function findProfissionalByCpf(cpf: string): Promise<{
  id: string
  nome: string
  status: string
} | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome, status')
    .eq('cpf', cpf)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: String(data.id),
    nome: String(data.nome),
    status: String(data.status),
  }
}

export async function confirmarPlantaoAceitePublico(input: {
  token: string
  cpf: string
}): Promise<ConfirmarPlantaoAceiteResultDto> {
  const convite = await resolveConviteByToken(input.token)
  const cpf = normalizeCpf(input.cpf)

  if (cpf.length !== 11) {
    throw new PublicPlantaoAceiteError('Informe um CPF válido.', 'CPF_INVALID', 400)
  }

  const profissional = await findProfissionalByCpf(cpf)
  if (!profissional || profissional.status !== 'ativo') {
    throw new PublicPlantaoAceiteError(
      'CPF não encontrado ou não elegível para este plantão.',
      'CPF_INVALID',
      403,
    )
  }

  const ctx = await loadProfissionalEscalaContext(profissional.id)
  const result = await inscreverProfissionalEscalaSlot(ctx, convite.slot_id)

  return {
    plantaoId: result.plantaoId,
    profissionalNome: profissional.nome,
    agendaUrl: appPublicUrls.profissionalAgendaUrl(),
  }
}
