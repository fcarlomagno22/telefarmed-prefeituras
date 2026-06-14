import { supabaseAdmin } from '../../db/supabase.js'
import { resolveTurnFromTime } from '../../lib/escalaDateTime.js'
import { createComunicadoWithDestinatarios } from '../comunicados/create.service.js'
import type { DestinatarioInsert } from '../comunicados/types.js'
import type { SlotListagemRow } from './types.js'

function parseBackupIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map(String).filter(Boolean)
}

function formatSlotDateBr(data: string): string {
  const [year, month, day] = data.split('-')
  if (!year || !month || !day) return data
  return `${day}/${month}/${year}`
}

function buildCancellationBody(rows: SlotListagemRow[]): string {
  if (rows.length === 1) {
    const row = rows[0]
    const { turnLabel } = resolveTurnFromTime(row.hora_inicio)
    const dateLabel = formatSlotDateBr(row.data)
    return [
      'Olá!',
      '',
      `Informamos que o plantão de ${row.especialidade_nome} previsto para ${dateLabel} (${turnLabel}) foi cancelado pela equipe de operações da Telefarmed.`,
      '',
      'Confira sua agenda atualizada no portal. Agradecemos sua compreensão e disponibilidade.',
      '',
      'Em caso de dúvidas, fale com o suporte.',
    ].join('\n')
  }

  return [
    'Olá!',
    '',
    'Informamos que um ou mais plantões em que você estava vinculado foram cancelados pela equipe de operações da Telefarmed.',
    '',
    'Confira sua agenda atualizada no portal. Agradecemos sua compreensão e disponibilidade.',
    '',
    'Em caso de dúvidas, fale com o suporte.',
  ].join('\n')
}

export async function collectLinkedProfissionaisBySlot(
  slotIds: string[],
  rows: SlotListagemRow[],
): Promise<Map<string, Set<string>>> {
  const bySlot = new Map<string, Set<string>>()

  const ensure = (slotId: string) => {
    if (!bySlot.has(slotId)) bySlot.set(slotId, new Set())
    return bySlot.get(slotId)!
  }

  for (const row of rows) {
    const linked = ensure(row.id)
    if (row.profissional_titular_id) linked.add(row.profissional_titular_id)
    for (const id of parseBackupIds(row.fila_reserva)) linked.add(id)
  }

  if (slotIds.length === 0) return bySlot

  const [{ data: confirmados, error: confirmadosError }, { data: inscricoes, error: inscricoesError }] =
    await Promise.all([
      supabaseAdmin
        .from('escala_plantoes_confirmados')
        .select('slot_id, profissional_id')
        .in('slot_id', slotIds)
        .in('status', ['confirmado', 'realizado']),
      supabaseAdmin
        .from('escala_inscricoes_profissional')
        .select('slot_id, profissional_id')
        .in('slot_id', slotIds)
        .in('status', ['pendente', 'aceita']),
    ])

  if (confirmadosError) throw confirmadosError
  if (inscricoesError) throw inscricoesError

  for (const row of confirmados ?? []) {
    ensure(String(row.slot_id)).add(String(row.profissional_id))
  }
  for (const row of inscricoes ?? []) {
    ensure(String(row.slot_id)).add(String(row.profissional_id))
  }

  return bySlot
}

function shouldNotifySlot(row: SlotListagemRow, linkedBySlot: Map<string, Set<string>>): boolean {
  if (row.status === 'publicada' || row.status === 'encerrada') return true
  return (linkedBySlot.get(row.id)?.size ?? 0) > 0
}

export async function notifyLinkedProfessionalsPlantaoRemoved(
  rows: SlotListagemRow[],
  linkedBySlot: Map<string, Set<string>>,
  admin: { id: string; nome: string },
): Promise<number> {
  const rowsToNotify = rows.filter((row) => shouldNotifySlot(row, linkedBySlot))
  if (rowsToNotify.length === 0) return 0

  const recipientIds = new Set<string>()
  for (const row of rowsToNotify) {
    for (const profissionalId of linkedBySlot.get(row.id) ?? []) {
      recipientIds.add(profissionalId)
    }
  }

  if (recipientIds.size === 0) return 0

  const { data: profissionais, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome')
    .eq('status', 'ativo')
    .in('id', [...recipientIds])

  if (error) throw error
  if (!profissionais || profissionais.length === 0) return 0

  const destinatarios: DestinatarioInsert[] = profissionais.map((item) => ({
    tipo: 'profissional',
    profissionalId: String(item.id),
    rotuloDestinatario: String(item.nome),
  }))

  const titulo = rowsToNotify.length === 1 ? 'Plantão cancelado' : 'Plantões cancelados'

  await createComunicadoWithDestinatarios(
    {
      titulo,
      corpo: buildCancellationBody(rowsToNotify),
      prioridade: 'importante',
      origem: 'telefarmed',
      audiencia: 'medico_plantao',
      remetenteTipo: 'admin',
      remetenteAdminId: admin.id,
      remetenteNome: admin.nome,
      alvosSnapshot: {
        source: 'admin_escala_delete',
        shiftIds: rowsToNotify.map((row) => row.id),
        shiftCount: rowsToNotify.length,
      },
      destinatariosResumo:
        destinatarios.length === 1
          ? '1 profissional'
          : `${destinatarios.length} profissionais`,
    },
    destinatarios,
  )

  return destinatarios.length
}
