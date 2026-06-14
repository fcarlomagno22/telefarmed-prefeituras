import { supabaseAdmin } from '../../db/supabase.js'
import {
  assertConsultaEmAndamento,
  assertConsultaOwnedByProfissional,
  loadConsultaById,
} from './ownership.js'

function formatNoteTimestamp(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function appendClinicalNote(existing: string, newNote: string): string {
  const trimmed = newNote.trim()
  if (!trimmed) return existing.trim()

  const entry = `[${formatNoteTimestamp()}]\n${trimmed}`
  const base = existing.trim()
  return base ? `${base}\n\n${entry}` : entry
}

export async function salvarProfissionalNotaProntuario(
  profissionalId: string,
  consultaId: string,
  nota: string,
  modo: 'adicionar' | 'substituir' = 'adicionar',
): Promise<{ notasClinicas: string }> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  const { data: current, error: loadError } = await supabaseAdmin
    .from('consultas')
    .select('notas_clinicas')
    .eq('id', consultaId)
    .maybeSingle()

  if (loadError) throw loadError

  const existingNotes = String(current?.notas_clinicas ?? '')
  const trimmed = nota.trim()
  const nextNotes =
    modo === 'substituir'
      ? trimmed
      : appendClinicalNote(existingNotes, trimmed)

  const { error } = await supabaseAdmin
    .from('consultas')
    .update({ notas_clinicas: nextNotes })
    .eq('id', consultaId)

  if (error) throw error
  return { notasClinicas: nextNotes }
}
