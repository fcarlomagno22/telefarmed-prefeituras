import { supabaseAdmin } from '../../db/supabase.js'
import {
  assertConsultaEmAndamento,
  assertConsultaOwnedByProfissional,
  loadConsultaById,
} from './ownership.js'

export type RegistrarPrescricaoInput = {
  medicamentoNome: string
  dosagem?: string
  via?: string
  frequencia?: string
  duracao?: string
  observacoes?: string
}

export async function registrarProfissionalPrescricao(
  profissionalId: string,
  consultaId: string,
  body: RegistrarPrescricaoInput,
): Promise<void> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  const { error } = await supabaseAdmin.from('consulta_prescricoes').insert({
    consulta_id: consultaId,
    medicamento_nome: body.medicamentoNome.trim(),
    dosagem: body.dosagem?.trim() ?? '',
    via: body.via?.trim() ?? '',
    frequencia: body.frequencia?.trim() ?? '',
    duracao: body.duracao?.trim() ?? '',
    observacoes: body.observacoes?.trim() ?? '',
  })

  if (error) throw error
}
