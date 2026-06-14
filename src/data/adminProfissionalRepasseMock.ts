import type { EscalaRepasseRule } from '../types/adminEscala'
import type {
  AdminPlantaoAuditoriaRow,
  AdminPlantaoElegibilidade,
  AdminRepasseProfissionalCompetenciaRow,
  AdminRepasseProfissionalStatus,
} from '../types/adminProfissionalRepasse'
import { PROFISSIONAL_SHIFT_AMOUNT_CENTS } from '../config/profissionalShiftRates'
import { computePlantaoRepasse } from '../utils/admin/computePlantaoRepasse'
import { createDefaultRepasseRule } from '../utils/adminEscala/repasseRule'

function ruleFixo(overrides?: Partial<EscalaRepasseRule>): EscalaRepasseRule {
  return {
    ...createDefaultRepasseRule(PROFISSIONAL_SHIFT_AMOUNT_CENTS),
    valorConsultaCentavos: 85_00,
    ...overrides,
  }
}

function ruleConsulta(overrides?: Partial<EscalaRepasseRule>): EscalaRepasseRule {
  return {
    modalidade: 'por_consulta',
    valorPlantaoCentavos: 0,
    valorConsultaCentavos: 95_00,
    criteriosPresenca: {
      minPercentualOnline: 80,
      exigeEncerramentoFormal: true,
      minConsultasConcluidas: 1,
      aceitaSemDemandaComprovada: false,
      tratamentoInelegivel: 'proporcional_consultas',
    },
    ...overrides,
  }
}

function ruleHibrido(overrides?: Partial<EscalaRepasseRule>): EscalaRepasseRule {
  return {
    modalidade: 'hibrido',
    valorPlantaoCentavos: PROFISSIONAL_SHIFT_AMOUNT_CENTS,
    valorConsultaCentavos: 75_00,
    percentualFixoHibrido: 30,
    criteriosPresenca: {
      minPercentualOnline: 80,
      exigeEncerramentoFormal: true,
      minConsultasConcluidas: 2,
      aceitaSemDemandaComprovada: false,
      tratamentoInelegivel: 'proporcional_consultas',
    },
    ...overrides,
  }
}

const RAW_PLANTOES: AdminPlantaoAuditoriaRow[] = [
  {
    id: 'pa-001',
    profissionalId: 'prof-carlos',
    profissionalNome: 'Dr. Carlos Mendes',
    pjRazaoSocial: 'Carlos Mendes Medicina Ltda',
    pjCnpj: '12.345.678/0001-90',
    competencia: 'Mai/2026',
    slotLabel: 'Clínico geral · Noturno',
    horarioPrevistoInicio: '2026-05-12T19:00:00',
    horarioPrevistoFim: '2026-05-13T07:00:00',
    enteredAt: '2026-05-12T18:55:00',
    endedAt: '2026-05-13T07:02:00',
    percentualOnline: 92,
    consultasAgendadas: 14,
    encaixes: 3,
    atendidos: 15,
    naoCompareceu: 1,
    desistiu: 1,
    encerramentoFormal: true,
    plantaoEncerrado: true,
    repasseRule: ruleFixo(),
    valorDeclaradoCentavos: 1_200_00,
  },
  {
    id: 'pa-002',
    profissionalId: 'prof-carlos',
    profissionalNome: 'Dr. Carlos Mendes',
    pjRazaoSocial: 'Carlos Mendes Medicina Ltda',
    pjCnpj: '12.345.678/0001-90',
    competencia: 'Mai/2026',
    slotLabel: 'Clínico geral · Diurno',
    horarioPrevistoInicio: '2026-05-18T07:00:00',
    horarioPrevistoFim: '2026-05-18T19:00:00',
    enteredAt: '2026-05-18T07:10:00',
    endedAt: '2026-05-18T14:30:00',
    percentualOnline: 58,
    consultasAgendadas: 8,
    encaixes: 2,
    atendidos: 4,
    naoCompareceu: 2,
    desistiu: 0,
    encerramentoFormal: false,
    plantaoEncerrado: true,
    repasseRule: ruleFixo({
      criteriosPresenca: {
        minPercentualOnline: 80,
        exigeEncerramentoFormal: true,
        minConsultasConcluidas: 1,
        aceitaSemDemandaComprovada: false,
        tratamentoInelegivel: 'proporcional_consultas',
      },
    }),
    valorDeclaradoCentavos: 340_00,
  },
  {
    id: 'pa-003',
    profissionalId: 'prof-ana',
    profissionalNome: 'Dra. Ana Paula Costa',
    pjRazaoSocial: 'Ana Costa Serviços Médicos ME',
    pjCnpj: '98.765.432/0001-10',
    competencia: 'Mai/2026',
    slotLabel: 'Pediatria · Telemedicina',
    horarioPrevistoInicio: '2026-05-08T08:00:00',
    horarioPrevistoFim: '2026-05-08T14:00:00',
    enteredAt: '2026-05-08T07:58:00',
    endedAt: '2026-05-08T14:05:00',
    percentualOnline: 88,
    consultasAgendadas: 0,
    encaixes: 0,
    atendidos: 0,
    naoCompareceu: 0,
    desistiu: 0,
    encerramentoFormal: true,
    plantaoEncerrado: true,
    repasseRule: ruleFixo({
      criteriosPresenca: {
        minPercentualOnline: 80,
        exigeEncerramentoFormal: true,
        minConsultasConcluidas: 1,
        aceitaSemDemandaComprovada: true,
        tratamentoInelegivel: 'aguardando_analise_manual',
      },
    }),
    valorDeclaradoCentavos: 1_200_00,
  },
  {
    id: 'pa-004',
    profissionalId: 'prof-ana',
    profissionalNome: 'Dra. Ana Paula Costa',
    pjRazaoSocial: 'Ana Costa Serviços Médicos ME',
    pjCnpj: '98.765.432/0001-10',
    competencia: 'Mai/2026',
    slotLabel: 'Pediatria · Noturno',
    horarioPrevistoInicio: '2026-05-22T19:00:00',
    horarioPrevistoFim: '2026-05-23T07:00:00',
    enteredAt: '2026-05-22T19:05:00',
    endedAt: '2026-05-23T06:50:00',
    percentualOnline: 85,
    consultasAgendadas: 6,
    encaixes: 1,
    atendidos: 7,
    naoCompareceu: 0,
    desistiu: 0,
    encerramentoFormal: true,
    plantaoEncerrado: true,
    repasseRule: ruleConsulta(),
    valorDeclaradoCentavos: 665_00,
  },
  {
    id: 'pa-005',
    profissionalId: 'prof-roberto',
    profissionalNome: 'Dr. Roberto Alves',
    pjRazaoSocial: 'Roberto Alves Clínica SS',
    pjCnpj: '44.222.111/0001-33',
    competencia: 'Mai/2026',
    slotLabel: 'Cardiologia · Híbrido',
    horarioPrevistoInicio: '2026-05-15T07:00:00',
    horarioPrevistoFim: '2026-05-15T19:00:00',
    enteredAt: '2026-05-15T07:00:00',
    endedAt: '2026-05-15T18:55:00',
    percentualOnline: 91,
    consultasAgendadas: 10,
    encaixes: 2,
    atendidos: 9,
    naoCompareceu: 1,
    desistiu: 0,
    encerramentoFormal: true,
    plantaoEncerrado: true,
    repasseRule: ruleHibrido(),
    valorDeclaradoCentavos: 1_035_00,
  },
  {
    id: 'pa-006',
    profissionalId: 'prof-roberto',
    profissionalNome: 'Dr. Roberto Alves',
    pjRazaoSocial: 'Roberto Alves Clínica SS',
    pjCnpj: '44.222.111/0001-33',
    competencia: 'Mai/2026',
    slotLabel: 'Cardiologia · Diurno',
    horarioPrevistoInicio: '2026-05-28T07:00:00',
    horarioPrevistoFim: '2026-05-28T19:00:00',
    enteredAt: '2026-05-28T07:20:00',
    endedAt: '2026-05-28T11:00:00',
    percentualOnline: 42,
    consultasAgendadas: 5,
    encaixes: 0,
    atendidos: 2,
    naoCompareceu: 1,
    desistiu: 0,
    encerramentoFormal: false,
    plantaoEncerrado: true,
    repasseRule: ruleHibrido(),
    valorDeclaradoCentavos: 150_00,
  },
  {
    id: 'pa-007',
    profissionalId: 'prof-paulo',
    profissionalNome: 'Dr. Paulo Henrique',
    pjRazaoSocial: 'PH Plantões Médicos EIRELI',
    pjCnpj: '11.222.333/0001-44',
    competencia: 'Abr/2026',
    slotLabel: 'Clínico geral · Telemedicina',
    horarioPrevistoInicio: '2026-04-10T19:00:00',
    horarioPrevistoFim: '2026-04-11T07:00:00',
    enteredAt: '2026-04-10T18:58:00',
    endedAt: '2026-04-11T07:00:00',
    percentualOnline: 94,
    consultasAgendadas: 12,
    encaixes: 4,
    atendidos: 14,
    naoCompareceu: 1,
    desistiu: 1,
    encerramentoFormal: true,
    plantaoEncerrado: true,
    repasseRule: ruleFixo(),
    valorDeclaradoCentavos: 1_200_00,
  },
  {
    id: 'pa-008',
    profissionalId: 'prof-paulo',
    profissionalNome: 'Dr. Paulo Henrique',
    pjRazaoSocial: 'PH Plantões Médicos EIRELI',
    pjCnpj: '11.222.333/0001-44',
    competencia: 'Mai/2026',
    slotLabel: 'Clínico geral · Noturno',
    horarioPrevistoInicio: '2026-06-05T19:00:00',
    horarioPrevistoFim: '2026-06-06T07:00:00',
    enteredAt: null,
    endedAt: null,
    percentualOnline: null,
    consultasAgendadas: 0,
    encaixes: 0,
    atendidos: 0,
    naoCompareceu: 0,
    desistiu: 0,
    encerramentoFormal: false,
    plantaoEncerrado: false,
    repasseRule: ruleFixo(),
    valorDeclaradoCentavos: null,
  },
  {
    id: 'pa-009',
    profissionalId: 'prof-juliana',
    profissionalNome: 'Dra. Juliana Martins',
    pjRazaoSocial: 'Juliana Martins Medicina Ltda',
    pjCnpj: '55.666.777/0001-88',
    competencia: 'Mai/2026',
    slotLabel: 'Ginecologia · Telemedicina',
    horarioPrevistoInicio: '2026-05-20T08:00:00',
    horarioPrevistoFim: '2026-05-20T14:00:00',
    enteredAt: '2026-05-20T08:02:00',
    endedAt: '2026-05-20T13:58:00',
    percentualOnline: 86,
    consultasAgendadas: 9,
    encaixes: 0,
    atendidos: 3,
    naoCompareceu: 2,
    desistiu: 1,
    encerramentoFormal: true,
    plantaoEncerrado: true,
    repasseRule: ruleConsulta(),
    valorDeclaradoCentavos: 285_00,
  },
]

const ELEGIBILIDADE_RANK: Record<AdminPlantaoElegibilidade, number> = {
  indeferido: 4,
  parcial: 3,
  pendente: 2,
  elegivel: 1,
}

function aggregateElegibilidade(values: AdminPlantaoElegibilidade[]): AdminPlantaoElegibilidade {
  if (values.length === 0) return 'pendente'
  return values.reduce((worst, current) =>
    ELEGIBILIDADE_RANK[current] > ELEGIBILIDADE_RANK[worst] ? current : worst,
  )
}

function predominantRule(
  plantoes: AdminPlantaoAuditoriaRow[],
): AdminRepasseProfissionalCompetenciaRow['regraPredominante'] {
  const counts = new Map<string, number>()
  for (const p of plantoes) {
    const key = p.repasseRule.modalidade
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let best: AdminRepasseProfissionalCompetenciaRow['regraPredominante'] = 'plantao_fixo'
  let max = 0
  for (const [key, count] of counts) {
    if (count > max) {
      max = count
      best = key as AdminRepasseProfissionalCompetenciaRow['regraPredominante']
    }
  }
  return best
}

const NF_MOCK_BY_KEY: Record<string, { fileName: string; enviadaEm: string }> = {
  'prof-carlos|05/2026': {
    fileName: 'NF_CarlosMendes_052026.pdf',
    enviadaEm: '2026-06-03T14:22:00',
  },
  'prof-ana|05/2026': {
    fileName: 'NF_AnaCosta_ME_052026.pdf',
    enviadaEm: '2026-06-04T09:10:00',
  },
  'prof-roberto|05/2026': {
    fileName: 'NF_RobertoAlves_SS_052026.pdf',
    enviadaEm: '2026-06-02T16:45:00',
  },
  'prof-juliana|05/2026': {
    fileName: 'NF_JulianaMartins_052026.pdf',
    enviadaEm: '2026-06-05T11:30:00',
  },
  'prof-paulo|04/2026': {
    fileName: 'NF_PHPlantoes_042026.pdf',
    enviadaEm: '2026-05-08T10:00:00',
  },
}

const STATUS_BY_KEY: Record<string, AdminRepasseProfissionalStatus> = {
  'prof-paulo|04/2026': 'pago',
  'prof-carlos|05/2026': 'pendente_conferencia',
  'prof-ana|05/2026': 'pendente_conferencia',
  'prof-roberto|05/2026': 'aprovado',
  'prof-juliana|05/2026': 'rejeitado',
  'prof-paulo|05/2026': 'pendente_conferencia',
}

export function buildAdminRepasseProfissionalRows(): AdminRepasseProfissionalCompetenciaRow[] {
  const groups = new Map<string, AdminPlantaoAuditoriaRow[]>()

  for (const plantao of RAW_PLANTOES) {
    const key = `${plantao.profissionalId}|${plantao.competencia}`
    const list = groups.get(key) ?? []
    list.push(plantao)
    groups.set(key, list)
  }

  const rows: AdminRepasseProfissionalCompetenciaRow[] = []

  for (const [key, plantoes] of groups) {
    const sample = plantoes[0]
    let valorCalculadoCentavos = 0
    let totalAtendidos = 0
    const elegibilidades: AdminPlantaoElegibilidade[] = []
    let temAlerta = false

    for (const plantao of plantoes) {
      const result = computePlantaoRepasse(plantao)
      valorCalculadoCentavos += result.valorCalculadoCentavos
      totalAtendidos += plantao.atendidos
      elegibilidades.push(result.elegibilidade)
      if (result.alertas.length > 0) temAlerta = true
    }

    const valorNFCentavos = plantoes.reduce(
      (sum, p) => sum + (p.valorDeclaradoCentavos ?? 0),
      0,
    )

    const nfMock = NF_MOCK_BY_KEY[key]

    rows.push({
      id: key.replace('|', '-'),
      profissionalId: sample.profissionalId,
      profissionalNome: sample.profissionalNome,
      pjRazaoSocial: sample.pjRazaoSocial,
      pjCnpj: sample.pjCnpj,
      competencia: sample.competencia,
      qtdPlantoes: plantoes.length,
      regraPredominante: predominantRule(plantoes),
      totalAtendidos,
      valorCalculadoCentavos,
      valorNFCentavos: valorNFCentavos > 0 ? valorNFCentavos : null,
      elegibilidadeAgregada: aggregateElegibilidade(elegibilidades),
      status: STATUS_BY_KEY[key] ?? 'pendente_conferencia',
      temAlerta,
      nfFileName: nfMock?.fileName ?? null,
      nfEnviadaEm: nfMock?.enviadaEm ?? null,
      plantoes,
    })
  }

  return rows.sort((a, b) => {
    const cmp = b.competencia.localeCompare(a.competencia, 'pt-BR')
    if (cmp !== 0) return cmp
    return a.profissionalNome.localeCompare(b.profissionalNome, 'pt-BR')
  })
}

export const adminRepasseProfissionalRows = buildAdminRepasseProfissionalRows()

export const adminRepasseProfissionalCompetencias = [
  ...new Set(adminRepasseProfissionalRows.map((row) => row.competencia)),
].sort((a, b) => b.localeCompare(a, 'pt-BR'))

export const adminRepasseProfissionalNomes = [
  ...new Set(adminRepasseProfissionalRows.map((row) => row.profissionalNome)),
].sort((a, b) => a.localeCompare(b, 'pt-BR'))
