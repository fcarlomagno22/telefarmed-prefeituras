import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { supabaseAdmin } from '../../db/supabase.js'
import { listFormacaoCboSeedRows } from '../faturamento/formacaoCbo.js'
import {
  parseFixedWidthLine,
  SIGTAP_OCUPACAO_COLUMNS,
  SIGTAP_PROCEDIMENTO_COLUMNS,
  SIGTAP_PROCEDIMENTO_OCUPACAO_COLUMNS,
} from './parseFixedWidth.js'

const BATCH_SIZE = 500

const DEFAULT_ESPECIALIDADE_PROCEDIMENTO: Record<string, string> = {
  '4': '0301010064',
  '179': '0301010064',
  '33': '0301010048',
  '34': '0301010048',
  '331': '0301010048',
  '337': '0301010048',
  '187': '0301010048',
}

const DEFAULT_MEDICAL_ESPECIALIDADE_PROCEDIMENTO = '0301010307'

async function readLines(filePath: string, encoding: BufferEncoding = 'latin1'): Promise<string[]> {
  const content = await readFile(filePath, encoding)
  return content.split(/\r?\n/).filter((line) => line.trim().length > 0)
}

async function readLinesStream(filePath: string, encoding: BufferEncoding = 'latin1'): Promise<string[]> {
  const lines: string[] = []
  const stream = createReadStream(filePath, { encoding })
  const rl = createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of rl) {
    if (line.trim()) lines.push(line)
  }

  return lines
}

async function upsertProcedimentos(
  rows: Array<{ codigo: string; nome: string }>,
): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabaseAdmin.from('config_sigtap_procedimento').upsert(rows, {
    onConflict: 'codigo',
  })
  if (error) throw error
}

async function upsertOcupacoes(rows: Array<{ codigo: string; nome: string }>): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabaseAdmin.from('config_sigtap_ocupacao').upsert(rows, {
    onConflict: 'codigo',
  })
  if (error) throw error
}

async function clearSigtapTables(): Promise<void> {
  const { error: vinculoError } = await supabaseAdmin
    .from('config_sigtap_procedimento_ocupacao')
    .delete()
    .not('procedimento_codigo', 'is', null)
  if (vinculoError) throw vinculoError

  const { error: especialidadeError } = await supabaseAdmin
    .from('config_sigtap_especialidade_procedimento')
    .delete()
    .not('especialidade_id', 'is', null)
  if (especialidadeError) throw especialidadeError

  const { error: formacaoError } = await supabaseAdmin
    .from('config_sigtap_formacao_cbo')
    .delete()
    .not('formacao', 'is', null)
  if (formacaoError) throw formacaoError

  const { error: procedimentoError } = await supabaseAdmin
    .from('config_sigtap_procedimento')
    .delete()
    .not('codigo', 'is', null)
  if (procedimentoError) throw procedimentoError

  const { error: ocupacaoError } = await supabaseAdmin
    .from('config_sigtap_ocupacao')
    .delete()
    .not('codigo', 'is', null)
  if (ocupacaoError) throw ocupacaoError
}

async function seedDefaultMappings(competencia: string): Promise<void> {
  const { data: especialidades, error: especialidadesError } = await supabaseAdmin
    .from('config_especialidades')
    .select('id')

  if (especialidadesError) throw especialidadesError

  const { data: profissoes, error: profissoesError } = await supabaseAdmin
    .from('config_especialidade_profissao')
    .select('especialidade_id, profissao_id')

  if (profissoesError) throw profissoesError

  const medicoProfissaoIds = new Set(
    (profissoes ?? [])
      .filter((row) => row.profissao_id === 'prof-medicos')
      .map((row) => String(row.especialidade_id)),
  )

  const especialidadeRows: Array<{ especialidade_id: string; procedimento_codigo: string }> = []

  for (const especialidade of especialidades ?? []) {
    const id = String(especialidade.id)
    let procedimentoCodigo = DEFAULT_ESPECIALIDADE_PROCEDIMENTO[id]

    if (!procedimentoCodigo && medicoProfissaoIds.has(id)) {
      procedimentoCodigo = DEFAULT_MEDICAL_ESPECIALIDADE_PROCEDIMENTO
    }

    if (procedimentoCodigo) {
      especialidadeRows.push({ especialidade_id: id, procedimento_codigo: procedimentoCodigo })
    }
  }

  if (especialidadeRows.length > 0) {
    const { error } = await supabaseAdmin
      .from('config_sigtap_especialidade_procedimento')
      .upsert(especialidadeRows, { onConflict: 'especialidade_id' })
    if (error) throw error
  }

  const formacaoRows = listFormacaoCboSeedRows()

  const { error: formacaoError } = await supabaseAdmin
    .from('config_sigtap_formacao_cbo')
    .upsert(formacaoRows, { onConflict: 'formacao' })

  if (formacaoError) throw formacaoError

  const { error: metaError } = await supabaseAdmin.from('config_sigtap_meta').upsert(
    {
      id: 1,
      competencia,
      importada_em: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (metaError) throw metaError
}

export type ImportSigtapOptions = {
  directory: string
  competencia?: string
}

export type ImportSigtapResult = {
  competencia: string
  procedimentos: number
  ocupacoes: number
  vinculos: number
}

export async function importSigtapFromDirectory(
  options: ImportSigtapOptions,
): Promise<ImportSigtapResult> {
  const directory = resolve(options.directory)
  const procedimentoPath = resolve(directory, 'tb_procedimento.txt')
  const ocupacaoPath = resolve(directory, 'tb_ocupacao.txt')
  const vinculoPath = resolve(directory, 'rl_procedimento_ocupacao.txt')

  const procedimentoLines = await readLines(procedimentoPath)
  const ocupacaoLines = await readLines(ocupacaoPath)
  const vinculoLines = await readLinesStream(vinculoPath)

  const competencia =
    options.competencia ??
    parseFixedWidthLine(procedimentoLines[0] ?? '', SIGTAP_PROCEDIMENTO_COLUMNS).DT_COMPETENCIA ??
    directory.split('/').pop() ??
    ''

  if (!/^\d{6}$/.test(competencia)) {
    throw new Error(`Competência SIGTAP inválida: ${competencia}`)
  }

  await clearSigtapTables()

  let procedimentos = 0
  for (let index = 0; index < procedimentoLines.length; index += BATCH_SIZE) {
    const batch = procedimentoLines.slice(index, index + BATCH_SIZE).map((line) => {
      const parsed = parseFixedWidthLine(line, SIGTAP_PROCEDIMENTO_COLUMNS)
      return {
        codigo: parsed.CO_PROCEDIMENTO,
        nome: parsed.NO_PROCEDIMENTO,
      }
    })

    await upsertProcedimentos(batch)
    procedimentos += batch.length
  }

  let ocupacoes = 0
  for (let index = 0; index < ocupacaoLines.length; index += BATCH_SIZE) {
    const batch = ocupacaoLines.slice(index, index + BATCH_SIZE).map((line) => {
      const parsed = parseFixedWidthLine(line, SIGTAP_OCUPACAO_COLUMNS)
      return {
        codigo: parsed.CO_OCUPACAO,
        nome: parsed.NO_OCUPACAO,
      }
    })

    await upsertOcupacoes(batch)
    ocupacoes += batch.length
  }

  let vinculos = 0
  for (let index = 0; index < vinculoLines.length; index += BATCH_SIZE) {
    const batch = vinculoLines.slice(index, index + BATCH_SIZE).map((line) => {
      const parsed = parseFixedWidthLine(line, SIGTAP_PROCEDIMENTO_OCUPACAO_COLUMNS)
      return {
        procedimento_codigo: parsed.CO_PROCEDIMENTO,
        ocupacao_codigo: parsed.CO_OCUPACAO,
      }
    })

    const { error } = await supabaseAdmin
      .from('config_sigtap_procedimento_ocupacao')
      .upsert(batch, { onConflict: 'procedimento_codigo,ocupacao_codigo' })

    if (error) throw error
    vinculos += batch.length
  }

  await seedDefaultMappings(competencia)

  return { competencia, procedimentos, ocupacoes, vinculos }
}
