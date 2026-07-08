import { supabaseAdmin } from '../db/supabase.js'
import { PacientesError } from '../modules/admin-pacientes/errors.js'

const DEFAULT_INACTIVE_MESSAGE =
  'Esta entidade ainda não possui contrato ativo.'

export async function assertEntityContractActive(
  entidadeContratanteId: string,
  inactiveMessage = DEFAULT_INACTIVE_MESSAGE,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select('id')
    .eq('entidade_contratante_id', entidadeContratanteId)
    .eq('status', 'ativo')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PacientesError(inactiveMessage, 'CONTRACT_INACTIVE', 403)
  }
}
