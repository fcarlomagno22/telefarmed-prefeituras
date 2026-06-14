import {
  centavosToReais,
  formatCnpjDisplay,
  formatCompetenciaLabelFromDate,
  formatDateBrFromIso,
} from './money.js'
import type {
  CentroCustoDto,
  ContaPagarDto,
  ContaPagarRow,
  FechamentoCompetenciaDto,
  FechamentoRow,
  FornecedorDto,
  NotaFiscalDto,
  PlantaoAuditoriaDto,
  RepasseCompetenciaDto,
} from './types.js'
import {
  aggregateElegibilidade,
  computePlantaoRepasse,
  mapFechamentoStatusToRepasse,
  parseRepasseRule,
  predominantModalidade,
} from './repasse-compute.js'

type FechamentoJoin = FechamentoRow & {
  contratos_entidade?: {
    numero: string | null
    tipo: string
    entidades_contratantes?: { nome_exibicao: string; razao_social: string } | null
  } | null
  notas_fiscais_fechamento?: Array<{
    numero: string
    status: string
    emitida_em: string | null
  }> | null
}

type FornecedorRow = {
  id: string
  cnpj: string
  razao_social: string
  situacao: string
  contato_email: string
  contato_telefone: string
  pessoa_contato: string
  observacoes: string
}

type CentroRow = { id: string; nome: string }

export function formatCentroCusto(row: CentroRow): CentroCustoDto {
  return { id: row.id, nome: row.nome }
}

export function formatFornecedor(row: FornecedorRow): FornecedorDto {
  return {
    id: row.id,
    cnpj: formatCnpjDisplay(row.cnpj),
    razaoSocial: row.razao_social,
    situacao: row.situacao as FornecedorDto['situacao'],
    contatoEmail: row.contato_email,
    contatoTelefone: row.contato_telefone,
    pessoaContato: row.pessoa_contato,
    observacoes: row.observacoes ?? '',
  }
}

export function formatContaPagar(row: ContaPagarRow): ContaPagarDto {
  const dto: ContaPagarDto = {
    id: row.id,
    fornecedorId: row.fornecedor_id,
    descricao: row.descricao,
    centroCustoId: row.centro_custo_id,
    recorrencia: row.recorrencia,
    valor: centavosToReais(row.valor_centavos),
    vencimento: formatDateBrFromIso(row.vencimento),
    status: row.status,
  }

  if (row.origem === 'repasse_profissional') {
    dto.origem = 'repasse_profissional'
    dto.repasseCompetenciaId = row.profissional_fechamento_id ?? undefined
    dto.repasseDraftId = row.id
    dto.repasseConferenciaStatus =
      row.repasse_conferencia_status ?? 'pendente_conferencia'
    if (row.repasse_snapshot) dto.repasseSnapshot = row.repasse_snapshot
  }

  return dto
}

export function formatNotaFiscal(
  row: { numero: string; status: string; emitida_em: string | null } | null | undefined,
  downloadUrl?: string,
): NotaFiscalDto | null {
  if (!row) return null
  return {
    status: row.status as NotaFiscalDto['status'],
    invoiceNumber: row.numero,
    issuedAt: row.emitida_em ?? undefined,
    downloadUrl,
  }
}

export function formatFechamento(row: FechamentoJoin, downloadUrl?: string): FechamentoCompetenciaDto {
  const entidade = row.contratos_entidade?.entidades_contratantes
  const prefeitura = entidade?.nome_exibicao || entidade?.razao_social || '—'
  const contratoNumero =
    row.contratos_entidade?.numero ??
    `CTR-${prefeitura.slice(0, 3).toUpperCase()}-${row.contrato_id.slice(-4)}`

  const notaRow = row.notas_fiscais_fechamento?.[0] ?? null

  return {
    id: row.id,
    prefeitura,
    contratoNumero,
    modalidade: row.contratos_entidade?.tipo ?? 'pacote_fechado',
    competencia: formatCompetenciaLabelFromDate(row.competencia_mes),
    consumoPercentual:
      row.consumo_percentual != null ? Number(row.consumo_percentual) : null,
    excedeuLimite: row.excedeu_limite,
    valorBase: centavosToReais(row.valor_base_centavos),
    valorExcedente: centavosToReais(row.valor_excedente_centavos),
    ajustes: centavosToReais(row.ajustes_centavos),
    valorFinal: centavosToReais(row.valor_final_centavos),
    status: row.status,
    vencimento: formatDateBrFromIso(row.vencimento),
    statusVencimento: row.status_vencimento,
    notaFiscal: formatNotaFiscal(notaRow, downloadUrl),
  }
}

export function formatPlantaoAuditoria(input: {
  plantao: {
    id: string
    profissional_id: string
    status: string
    slot: {
      data: string
      hora_inicio: string
      hora_fim: string
      valor_centavos: number
      repasse_regra: unknown
      especialidade_nome?: string
    }
    sessao?: {
      entered_at: string
      ended_at: string | null
      summary: unknown
    } | null
    metrics: {
      consultasAgendadas: number
      encaixes: number
      atendidos: number
      naoCompareceu: number
      desistiu: number
      percentualOnline: number | null
      encerramentoFormal: boolean
    }
  }
  profissionalNome: string
  pjRazaoSocial: string
  pjCnpj: string
  competencia: string
}): PlantaoAuditoriaDto {
  const { plantao, profissionalNome, pjRazaoSocial, pjCnpj, competencia } = input
  const slot = plantao.slot
  const repasseRule = parseRepasseRule(slot.repasse_regra, slot.valor_centavos)
  const plantaoEncerrado =
    plantao.status === 'realizado' || Boolean(plantao.sessao?.ended_at)

  const computed = computePlantaoRepasse({
    plantaoEncerrado,
    percentualOnline: plantao.metrics.percentualOnline,
    consultasAgendadas: plantao.metrics.consultasAgendadas,
    encaixes: plantao.metrics.encaixes,
    atendidos: plantao.metrics.atendidos,
    encerramentoFormal: plantao.metrics.encerramentoFormal,
    repasseRule,
  })

  void computed

  const slotLabel =
    slot.especialidade_nome ??
    `${slot.data} ${slot.hora_inicio.slice(0, 5)}–${slot.hora_fim.slice(0, 5)}`

  return {
    id: plantao.id,
    profissionalId: plantao.profissional_id,
    profissionalNome,
    pjRazaoSocial,
    pjCnpj,
    competencia: formatCompetenciaLabelFromDate(competencia),
    slotLabel,
    horarioPrevistoInicio: `${slot.data}T${slot.hora_inicio}`,
    horarioPrevistoFim: `${slot.data}T${slot.hora_fim}`,
    enteredAt: plantao.sessao?.entered_at ?? null,
    endedAt: plantao.sessao?.ended_at ?? null,
    percentualOnline: plantao.metrics.percentualOnline,
    consultasAgendadas: plantao.metrics.consultasAgendadas,
    encaixes: plantao.metrics.encaixes,
    atendidos: plantao.metrics.atendidos,
    naoCompareceu: plantao.metrics.naoCompareceu,
    desistiu: plantao.metrics.desistiu,
    encerramentoFormal: plantao.metrics.encerramentoFormal,
    plantaoEncerrado,
    repasseRule,
    valorDeclaradoCentavos: null,
  }
}

export function formatRepasseCompetencia(input: {
  fechamento: {
    id: string
    profissional_id: string
    competencia: string
    status: string
    invoice_file_name: string
    submitted_at: string | null
    valor_calculado_centavos: number
    valor_aprovado_centavos: number | null
    valor_nf_centavos: number | null
    plantoes_snapshot: unknown
  }
  profissionalNome: string
  pjRazaoSocial: string
  pjCnpj: string
  plantoes: PlantaoAuditoriaDto[]
}): RepasseCompetenciaDto {
  const { fechamento, profissionalNome, pjRazaoSocial, pjCnpj, plantoes } = input

  const elegibilidades = plantoes.map((p) => {
    const computed = computePlantaoRepasse({
      plantaoEncerrado: p.plantaoEncerrado,
      percentualOnline: p.percentualOnline,
      consultasAgendadas: p.consultasAgendadas,
      encaixes: p.encaixes,
      atendidos: p.atendidos,
      encerramentoFormal: p.encerramentoFormal,
      repasseRule: p.repasseRule,
      valorDeclaradoCentavos: p.valorDeclaradoCentavos,
    })
    return computed.elegibilidade
  })

  const temAlerta = plantoes.some((p) => {
    const computed = computePlantaoRepasse({
      plantaoEncerrado: p.plantaoEncerrado,
      percentualOnline: p.percentualOnline,
      consultasAgendadas: p.consultasAgendadas,
      encaixes: p.encaixes,
      atendidos: p.atendidos,
      encerramentoFormal: p.encerramentoFormal,
      repasseRule: p.repasseRule,
    })
    return computed.alertas.length > 0 && !p.decisaoAnalista
  })

  const valorCalculadoCentavos =
    fechamento.valor_calculado_centavos > 0
      ? fechamento.valor_calculado_centavos
      : plantoes.reduce((sum, p) => {
          const c = computePlantaoRepasse({
            plantaoEncerrado: p.plantaoEncerrado,
            percentualOnline: p.percentualOnline,
            consultasAgendadas: p.consultasAgendadas,
            encaixes: p.encaixes,
            atendidos: p.atendidos,
            encerramentoFormal: p.encerramentoFormal,
            repasseRule: p.repasseRule,
          })
          return sum + c.valorCalculadoCentavos
        }, 0)

  return {
    id: fechamento.id,
    profissionalId: fechamento.profissional_id,
    profissionalNome,
    pjRazaoSocial,
    pjCnpj,
    competencia: formatCompetenciaLabelFromDate(fechamento.competencia),
    qtdPlantoes: plantoes.length,
    regraPredominante: predominantModalidade(plantoes.map((p) => p.repasseRule.modalidade)),
    totalAtendidos: plantoes.reduce((s, p) => s + p.atendidos, 0),
    valorCalculadoCentavos,
    valorNFCentavos: fechamento.valor_nf_centavos,
    elegibilidadeAgregada: aggregateElegibilidade(elegibilidades),
    status: mapFechamentoStatusToRepasse(fechamento.status),
    temAlerta,
    nfFileName: fechamento.invoice_file_name || null,
    nfEnviadaEm: fechamento.submitted_at,
    plantoes,
  }
}

export function competenciaLabelToMonthKey(label: string): string | null {
  const brMatch = /^([A-Za-z]{3})\/(\d{4})$/.exec(label.trim())
  if (brMatch) {
    const months: Record<string, string> = {
      Jan: '01', Fev: '02', Mar: '03', Abr: '04', Mai: '05', Jun: '06',
      Jul: '07', Ago: '08', Set: '09', Out: '10', Nov: '11', Dez: '12',
    }
    const mm = months[brMatch[1]!]
    if (mm) return `${brMatch[2]}-${mm}-01`
  }
  const isoMatch = /^(\d{4})-(\d{2})$/.exec(label.trim())
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-01`
  return null
}
