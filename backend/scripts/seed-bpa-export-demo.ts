import { randomBytes } from 'node:crypto'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { supabaseAdmin } from '../src/db/supabase.js'
import { rebuildConsultaRegistroSus } from '../src/lib/faturamento/rebuildRegistroSus.js'
import { fecharPrefeituraFaturamento } from '../src/modules/prefeitura-faturamento/fechamento.service.js'

config({ path: resolve(process.cwd(), '.env') })

const ENTIDADE_ID = '2c0ece8d-63d4-4750-89e3-15f26f03cac8'
const UNIDADE_ID = '9ecebf2d-9480-4481-8067-ded2ba56384e'
const PROF_ID = '032ea05d-a847-494c-8381-3824a295dbc5'
const ESPECIALIDADE_ID = 'spec-1780354891941-1'
const COMPETENCIA = '2026-06'
const FECHAMENTO_RECORD_ID = 'rec-2026-06-principal'
const TARGET = 22

const PROFISSIONAL_CNS = '898001234567800'
const PROFISSIONAL_CBO = '225125'

const RACAS = ['branca', 'parda', 'preta', 'amarela', 'indigena'] as const
const SEXOS = ['masculino', 'feminino'] as const

function codigoAtendimento(index: number): string {
  if (index === 0) return 'bpa-demo-existente-01'
  return `bpa-demo-${String(index).padStart(2, '0')}-${randomBytes(4).toString('hex')}`
}

function cpfDemo(index: number): string {
  const base = String(70000000000 + index).padStart(11, '0')
  return base.slice(0, 11)
}

function enderecoDemo() {
  return {
    uf: 'SP',
    cep: '15600010',
    bairro: 'Centro',
    cidade: 'Fernandopolis',
    municipio: 'Fernandopolis',
    numero: '100',
    logradouro: 'Rua Demo BPA',
    complemento: '',
    ibge: '3515509',
  }
}

function finalizadaEm(day: number): string {
  const dayClamped = Math.min(Math.max(day, 1), 28)
  return `2026-06-${String(dayClamped).padStart(2, '0')}T14:00:00.000Z`
}

async function ensureBaseConfig() {
  const { error: entidadeError } = await supabaseAdmin
    .from('entidades_contratantes')
    .update({
      config_faturamento_sus: {
        cnesExecutante: '3131231',
        responsavelNome: 'IRMANDADE SANTA CASA DE FERNANDOPOLIS',
        responsavelSigla: 'SCF',
        responsavelCnpjCpf: '47844287000108',
        destinatarioNome: 'SECRETARIA MUNICIPAL DE SAUDE FERNANDOPOLIS',
        destinoIndicador: 'M',
        versaoSistema: 'TELEFARMED001',
      },
    })
    .eq('id', ENTIDADE_ID)

  if (entidadeError) throw entidadeError

  const { error: profError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .update({
      cns: PROFISSIONAL_CNS,
      cbo_codigo: PROFISSIONAL_CBO,
      cbo_descricao: 'Medico clinico',
    })
    .eq('id', PROF_ID)

  if (profError) throw profError
}

async function ensureExistingConsulta(): Promise<string> {
  const existingConsultaId = 'ea942685-eddc-4e84-9c66-3f21aaa3da0c'
  const existingPacienteId = 'b64655ba-6a04-456d-b497-c5e4c7050aa5'

  const { error: pacienteError } = await supabaseAdmin
    .from('pacientes')
    .update({
      cns: null,
      cns_pendente: true,
      raca_cor: 'branca',
      nacionalidade: 'brasileira',
      endereco: enderecoDemo(),
    })
    .eq('id', existingPacienteId)

  if (pacienteError) throw pacienteError

  const { error: consultaError } = await supabaseAdmin
    .from('consultas')
    .update({
      status: 'concluida',
      finalizada_em: finalizadaEm(1),
      iniciada_em: finalizadaEm(1),
      profissional_id: PROF_ID,
    })
    .eq('id', existingConsultaId)

  if (consultaError) throw consultaError

  return existingConsultaId
}

async function countConsultasCompetencia(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('consultas')
    .select('id', { count: 'exact', head: true })
    .eq('entidade_contratante_id', ENTIDADE_ID)
    .eq('status', 'concluida')
    .gte('finalizada_em', '2026-06-01T00:00:00.000Z')
    .lte('finalizada_em', '2026-06-30T23:59:59.999Z')

  if (error) throw error
  return count ?? 0
}

async function createPaciente(index: number): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .insert({
      cpf: cpfDemo(index),
      nome: `Paciente Demo BPA ${String(index).padStart(2, '0')} Silva`,
      data_nascimento: `198${index % 10}-0${(index % 9) + 1}-15`,
      sexo: SEXOS[index % SEXOS.length],
      cns: null,
      cns_pendente: true,
      nacionalidade: 'brasileira',
      raca_cor: RACAS[index % RACAS.length],
      telefone: `1699000${String(index).padStart(4, '0')}`,
      email: `bpa.demo.${index}@example.com`,
      endereco: enderecoDemo(),
      contato_emergencia: {},
      entidade_contratante_id: ENTIDADE_ID,
      status: 'ativo',
    })
    .select('id')
    .single()

  if (error) throw error
  return String(data.id)
}

async function createConsulta(pacienteId: string, index: number): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .insert({
      codigo_atendimento: codigoAtendimento(index),
      entidade_contratante_id: ENTIDADE_ID,
      unidade_ubt_id: UNIDADE_ID,
      paciente_id: pacienteId,
      profissional_id: PROF_ID,
      especialidade_id: ESPECIALIDADE_ID,
      tipo: 'consulta',
      status: 'concluida',
      triagem_resumo: 'Teleconsulta demo BPA',
      notas_clinicas: 'Atendimento concluido para teste de exportacao BPA-I.',
      iniciada_em: finalizadaEm(index + 1),
      finalizada_em: finalizadaEm(index + 1),
      duracao_minutos: 25,
    })
    .select('id')
    .single()

  if (error) throw error
  return String(data.id)
}

async function rebuildAll(consultaIds: string[]) {
  let faturaveis = 0
  for (const consultaId of consultaIds) {
    const result = await rebuildConsultaRegistroSus(consultaId)
    if (result?.faturavel) faturaveis += 1
    else if (result) {
      console.warn(`[seed] Consulta ${consultaId} pendencias:`, result.pendencias.join(', '))
    }
  }
  return faturaveis
}

async function resetFechamento() {
  await supabaseAdmin
    .from('faturamento_fechamento_consultas')
    .delete()
    .eq('fechamento_record_id', FECHAMENTO_RECORD_ID)

  await supabaseAdmin
    .from('faturamento_lote_exclusoes')
    .delete()
    .eq('fechamento_record_id', FECHAMENTO_RECORD_ID)

  await supabaseAdmin
    .from('faturamento_fechamentos')
    .update({
      status: 'em_preparacao',
      closed_at: null,
      closed_by: null,
      fechamento_id: null,
      lote_id: null,
      exported_at: null,
      consultas_no_lote: null,
      bloqueantes_registrados: null,
    })
    .eq('id', FECHAMENTO_RECORD_ID)
}

async function main() {
  const shouldClose = process.argv.includes('--fechar')
  console.log('[seed] Configurando entidade, profissional e consulta existente...')
  await ensureBaseConfig()
  const existingConsultaId = await ensureExistingConsulta()

  const current = await countConsultasCompetencia()
  const toCreate = Math.max(0, TARGET - current)
  console.log(`[seed] Consultas na competência: ${current}. Criando mais ${toCreate}...`)

  const createdConsultaIds: string[] = []

  if (current === 0) {
    createdConsultaIds.push(existingConsultaId)
  }

  for (let i = 1; i <= toCreate; i += 1) {
    const pacienteId = await createPaciente(i)
    const consultaId = await createConsulta(pacienteId, i)
    createdConsultaIds.push(consultaId)
  }

  const { data: allConsultas, error: listError } = await supabaseAdmin
    .from('consultas')
    .select('id')
    .eq('entidade_contratante_id', ENTIDADE_ID)
    .eq('status', 'concluida')
    .gte('finalizada_em', '2026-06-01T00:00:00.000Z')
    .lte('finalizada_em', '2026-06-30T23:59:59.999Z')

  if (listError) throw listError

  const consultaIds = (allConsultas ?? []).map((row) => String(row.id))
  console.log(`[seed] Rebuild registro SUS (${consultaIds.length} consultas)...`)
  const faturaveis = await rebuildAll(consultaIds)
  console.log(`[seed] Faturáveis: ${faturaveis}/${consultaIds.length}`)

  await resetFechamento()

  if (!shouldClose) {
    console.log('[seed] Concluído (fechamento em preparação — use a UI para fechar).')
    console.log(`  Entidade: ${ENTIDADE_ID}`)
    console.log(`  Competência: ${COMPETENCIA}`)
    console.log(`  Fechamento: ${FECHAMENTO_RECORD_ID}`)
    console.log(`  Faturáveis: ${faturaveis}/${consultaIds.length}`)
    console.log('  Para fechar via script: npm run seed:bpa-export-demo -- --fechar')
    return
  }

  console.log('[seed] Fechando competência 2026-06...')
  const closeResult = await fecharPrefeituraFaturamento(
    ENTIDADE_ID,
    FECHAMENTO_RECORD_ID,
    'seed-bpa-export-demo',
  )

  if (!closeResult.ok) {
    throw new Error(closeResult.errorReason)
  }

  console.log('[seed] Concluído.')
  console.log(`  Entidade: ${ENTIDADE_ID}`)
  console.log(`  Competência: ${COMPETENCIA}`)
  console.log(`  Fechamento: ${FECHAMENTO_RECORD_ID}`)
  console.log(`  ${closeResult.message}`)
  console.log(`  Fechamento ID: ${closeResult.fechamentoId}`)
}

main().catch((error) => {
  console.error('[seed] Falha', error)
  process.exit(1)
})
