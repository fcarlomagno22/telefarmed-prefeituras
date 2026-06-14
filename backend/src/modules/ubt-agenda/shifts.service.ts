import { supabaseAdmin } from '../../db/supabase.js'
import { formatDoctorShift } from './formatters.js'
import { loadActiveContratoIds } from './ownership.js'
import { slotVisibleToUbt } from './slot-utils.js'
import type { DoctorShiftDto, UbtScope } from './types.js'

export async function listUbtAgendaDoctorShifts(
  scope: UbtScope,
  date: string,
): Promise<DoctorShiftDto[]> {
  const contratoIds = await loadActiveContratoIds(scope.entidadeContratanteId)
  if (contratoIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      id,
      profissional_id,
      usuarios_profissionais!inner ( nome ),
      escala_slots!inner (
        hora_inicio,
        hora_fim,
        modalidade,
        escopo_ubt,
        status,
        contrato_entidade_id,
        config_especialidades!inner ( nome )
      )
    `,
    )
    .in('status', ['confirmado', 'realizado'])
    .eq('escala_slots.data', date)
    .eq('escala_slots.status', 'publicada')
    .in('escala_slots.contrato_entidade_id', contratoIds)

  if (error) throw error

  const plantaoIds = (data ?? []).map((row) => String(row.id))
  const sessaoByPlantao = new Map<string, { entered_at: string; ended_at: string | null }>()

  if (plantaoIds.length > 0) {
    const { data: sessoes } = await supabaseAdmin
      .from('profissional_plantao_sessoes')
      .select('plantao_id, entered_at, ended_at')
      .in('plantao_id', plantaoIds)

    for (const sessao of sessoes ?? []) {
      sessaoByPlantao.set(String(sessao.plantao_id), {
        entered_at: String(sessao.entered_at),
        ended_at: sessao.ended_at ? String(sessao.ended_at) : null,
      })
    }
  }

  const shifts: DoctorShiftDto[] = []

  for (const item of data ?? []) {
    const slotRaw = item.escala_slots as unknown
    const slot = Array.isArray(slotRaw) ? slotRaw[0] : slotRaw
    if (!slot || typeof slot !== 'object') continue

    const slotObj = slot as {
      hora_inicio: string
      hora_fim: string
      modalidade: string
      escopo_ubt: unknown
      config_especialidades?: { nome: string } | { nome: string }[] | null
    }

    if (
      !slotVisibleToUbt(slotObj.escopo_ubt, scope.unidadeUbtId, String(slotObj.modalidade ?? 'tele'))
    ) {
      continue
    }

    const profRaw = item.usuarios_profissionais as unknown
    const prof = Array.isArray(profRaw) ? profRaw[0] : profRaw
    const espRaw = slotObj.config_especialidades
    const esp = Array.isArray(espRaw) ? espRaw[0] : espRaw
    const sessao = sessaoByPlantao.get(String(item.id))

    shifts.push(
      formatDoctorShift({
        doctorId: String(item.profissional_id),
        doctorName: String((prof as { nome?: string })?.nome ?? 'Profissional'),
        specialtyName: String(esp?.nome ?? ''),
        horaInicio: String(slotObj.hora_inicio),
        horaFim: String(slotObj.hora_fim),
        enteredAt: sessao?.entered_at ?? null,
        endedAt: sessao?.ended_at ?? null,
      }),
    )
  }

  return shifts.sort((a, b) => a.startTime.localeCompare(b.startTime, 'pt-BR'))
}
